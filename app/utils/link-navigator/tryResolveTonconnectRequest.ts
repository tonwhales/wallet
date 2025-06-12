import { MutableRefObject } from "react";
import { ToastDuration, Toaster } from "../../components/toast/ToastProvider";
import { checkTonconnectTxRequest, ConnectedAppConnectionRemote, ConnectPushQuery, PendingTonconnectRequest, SendTransactionError, SignRawTxParams, TonConnectBridgeType, tonconnectRpcReqScheme } from "../../engine/tonconnect";
import { TypedNavigation } from "../useTypedNavigation";
import { AppState, getAppState } from "../../storage/appState";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { getFullConnectionsMap, getStoredConnectExtensions } from "../../engine/state/tonconnect";
import { ConnectedApp } from "../../engine/hooks/dapps/useTonConnectExtenstions";
import { extensionKey } from "../../engine/hooks/dapps/useAddExtension";
import { AppRequest, Base64, CHAIN, hexToByteArray, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from "@tonconnect/protocol";
import { sendTonConnectResponse } from "../../engine/api/sendTonConnectResponse";
import { TransferFragmentParams } from "../../fragments/secure/transfer/TransferFragment";
import { extractDomain } from "../../engine/utils/extractDomain";
import { warn } from "../log";
import { t } from "../../i18n/t";

export function tryResolveTonconnectRequest(
    params: {
        query: ConnectPushQuery,
        isTestnet: boolean,
        toaster: Toaster,
        navigation: TypedNavigation,
        pendingReqsUpdaterRef: MutableRefObject<(updater: (currVal: PendingTonconnectRequest[]) => PendingTonconnectRequest[]) => void>,
        updateAppState: (value: AppState, isTestnet: boolean) => void,
        toastProps?: { duration?: ToastDuration, marginBottom?: number }
    }
) {
    const {
        query,
        toaster, toastProps,
        navigation,
        isTestnet,
        pendingReqsUpdaterRef,
        updateAppState
    } = params;

    try {
        const isFresh = query.validUntil > Math.floor(Date.now() / 1000);
        const message = query.message;
        const from = query.from;
        const to = query.to;

        const appState = getAppState();
        const address = Address.parse(to);
        const index = appState.addresses.findIndex((a) => a.address.equals(address));

        // Check if address is valid & is imported
        if (index === -1) {
            toaster.show({
                message: t('products.transactionRequest.invalidFrom'),
                ...toastProps, type: 'error'
            });
            return;
        }

        // Check if request is fresh
        if (!isFresh) {
            toaster.show({
                message: t('products.transactionRequest.expired'),
                ...toastProps, type: 'error'
            });
            return;
        }

        // Find connected app with appConnection
        const allAppsMap = getStoredConnectExtensions(address.toString({ testOnly: isTestnet }));
        const allConnectionsMap = getFullConnectionsMap();
        const allTargetConnectionsMap = allConnectionsMap[address.toString({ testOnly: isTestnet })];

        let appConnection: { app: ConnectedApp, session: ConnectedAppConnectionRemote } | null = null;

        // Find connected app with appConnection
        for (const app of Object.values(allAppsMap)) {
            const appConnections = allTargetConnectionsMap[extensionKey(app.url)];
            if (appConnections) {
                const session = appConnections.find((item) => {
                    return item.type === TonConnectBridgeType.Remote && item.clientSessionId === from;
                });
                if (!!session) {
                    appConnection = { app, session: session as ConnectedAppConnectionRemote };
                    break;
                }
            }
        }

        if (!appConnection) {
            toaster.show({
                message: t('products.transactionRequest.noConnection'),
                ...toastProps, type: 'error'
            });
            return;
        }

        const sessionCrypto = new SessionCrypto(appConnection.session.sessionKeyPair);
        const decryptedRequest = sessionCrypto.decrypt(
            Base64.decode(message).toUint8Array(),
            hexToByteArray(from),
        );
        const parsed = JSON.parse(decryptedRequest);

        // validate request
        if (!tonconnectRpcReqScheme.safeParse(parsed).success) {
            toaster.show({
                message: t('products.transactionRequest.invalidRequest'),
                ...toastProps, type: 'error'
            });
            return;
        }

        const request = parsed as AppRequest<RpcMethod>;

        // transaction request
        if (request.method === 'sendTransaction') {
            const callback = (response: WalletResponse<RpcMethod>) => sendTonConnectResponse({ response, sessionCrypto, clientSessionId: from });
            const params = JSON.parse(request.params[0]) as SignRawTxParams;

            // check if request is valid
            const isValidRequest = checkTonconnectTxRequest(request.id.toString(), params, callback, isTestnet, toaster);

            if (!isValidRequest) {
                return;
            }

            // check if network is correct
            if (!!params.network) {
                const walletNetwork = isTestnet ? CHAIN.TESTNET : CHAIN.MAINNET;
                if (params.network !== walletNetwork) {
                    toaster.show({
                        message: t('products.transactionRequest.wrongNetwork'),
                        ...toastProps, type: 'error'
                    });
                    callback({
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                            message: 'Invalid network',
                        },
                        id: request.id.toString(),
                    });
                    return;
                }
            }

            // compile messages
            const orderMessages = [];
            for (const message of params.messages) {
                try {
                    const msg = {
                        amount: toNano(fromNano(message.amount)),
                        target: message.address,
                        amountAll: false,
                        payload: message.payload ? Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0] : null,
                        stateInit: message.stateInit ? Cell.fromBoc(Buffer.from(message.stateInit, 'base64'))[0] : null
                    }
                    orderMessages.push(msg);
                } catch {
                    // ignore invalid messages
                }
            }

            // clear all current requests for this clientSessionId
            const clearFromRequests = () => {
                const updater = pendingReqsUpdaterRef.current;
                updater((prev) => prev.filter((req) => req.from !== from));
            }

            // result callback
            const responseCallback = async (ok: boolean, result: Cell | null) => {
                try {
                    await sendTonConnectResponse({
                        response: !ok
                            ? new SendTransactionError(
                                request.id,
                                SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                                'Wallet declined the request',
                            )
                            : { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id },
                        sessionCrypto,
                        clientSessionId: from
                    });
                } catch {
                    toaster.show({
                        message: !ok
                            ? t('products.transactionRequest.failedToReportCanceled')
                            : t('products.transactionRequest.failedToReport'),
                        ...toastProps,
                        type: 'error'
                    });
                }
                // avoid double sending
                clearFromRequests();
            };

            const prepared: TransferFragmentParams = {
                text: null,
                order: {
                    type: 'order',
                    messages: orderMessages,
                    app: { title: appConnection.app.name, domain: extractDomain(appConnection.app.url), url: appConnection.app.url }
                },
                callback: responseCallback
            };

            // check if "to" address is selected
            const isSelected = appState.selected === index;

            if (!isSelected) {
                // Select new address
                updateAppState({ ...appState, selected: index }, isTestnet);
                // navigate to home with tx to be opened after
                navigation.navigateAndReplaceHome({ navigateTo: { type: 'tonconnect-request', request: prepared } });
            } else {
                navigation.navigateTransfer(prepared);
            }
        } else if (request.method === 'signData') {
            // checkTonconnectSignRequest
        }
    } catch {
        warn('Failed to resolve TonConnect request');
        toaster.show({
            message: t('products.transactionRequest.invalidRequest'),
            ...toastProps, type: 'error'
        });
        return;
    }
}