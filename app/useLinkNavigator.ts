import { t } from './i18n/t';
import { TypedNavigation, useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useConnectPendingRequests, useSetAppState } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';
import { Address, Cell, fromNano, toNano } from '@ton/core';
import { fetchAccountTransactions } from './engine/api/fetchAccountTransactions';
import { contractMetadataQueryFn, jettonMasterContentQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from './engine/hooks/transactions/useAccountTransactions';
import { AppState, getAppState } from './storage/appState';
import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { ToastDuration, Toaster, useToaster } from './components/toast/ToastProvider';
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { useGlobalLoader } from './components/useGlobalLoader';
import { StoredJettonWallet } from './engine/metadata/StoredMetadata';
import { createBackoff } from './utils/time';
import { getQueryData } from './engine/utils/getQueryData';
import { SelectedAccount, StoredTransaction } from './engine/types';
import { TonConnectAuthType } from './fragments/secure/dapps/TonConnectAuthenticateFragment';
import { warn } from './utils/log';
import { getFullConnectionsMap, getStoredConnectExtensions } from './engine/state/tonconnect';
import { ConnectedAppConnectionRemote, ConnectPushQuery, SendTransactionError, SendTransactionRequest, SignRawParams, TonConnectBridgeType } from './engine/tonconnect/types';
import { AppRequest, Base64, CHAIN, hexToByteArray, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from '@tonconnect/protocol';
import { transactionRpcRequestCodec } from './engine/tonconnect/codecs';
import { sendTonConnectResponse } from './engine/api/sendTonConnectResponse';
import { extensionKey } from './engine/hooks/dapps/useAddExtension';
import { ConnectedApp } from './engine/hooks/dapps/useTonConnectExtenstions';
import { TransferFragmentProps } from './fragments/secure/TransferFragment';
import { extractDomain } from './engine/utils/extractDomain';
import { Linking } from 'react-native';
import { openWithInApp } from './utils/openWithInApp';
import { getHoldersToken, HoldersAccountStatus } from './engine/hooks/holders/useHoldersAccountStatus';
import { HoldersUserState, holdersUrl } from './engine/api/holders/fetchUserState';
import { getIsConnectAppReady } from './engine/hooks/dapps/useIsConnectAppReady';
import { HoldersAppParams, HoldersAppParamsType } from './fragments/holders/HoldersAppFragment';

const infoBackoff = createBackoff({ maxFailureCount: 10 });

function tryResolveTonconnectRequest(
    params: {
        query: ConnectPushQuery,
        isTestnet: boolean,
        toaster: Toaster,
        navigation: TypedNavigation,
        pendingReqsUpdaterRef: MutableRefObject<(updater: (currVal: SendTransactionRequest[]) => SendTransactionRequest[]) => void>,
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
        if (!transactionRpcRequestCodec.is(parsed)) {
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
            const params = JSON.parse(request.params[0]) as SignRawParams;

            // check if request is valid
            const isValidRequest =
                params && typeof params.valid_until === 'number' &&
                Array.isArray(params.messages) &&
                params.messages.every((msg) => !!msg.address && !!msg.amount);

            if (!isValidRequest) {
                // report error
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: 'Bad request',
                    },
                    id: request.id.toString(),
                });
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
            const messages = [];
            for (const message of params.messages) {
                try {
                    const msg = {
                        amount: toNano(fromNano(message.amount)),
                        target: message.address,
                        amountAll: false,
                        payload: message.payload ? Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0] : null,
                        stateInit: message.stateInit ? Cell.fromBoc(Buffer.from(message.stateInit, 'base64'))[0] : null
                    }
                    messages.push(msg);
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

            const prepared: TransferFragmentProps = {
                text: null, job: null,
                order: {
                    type: 'order',
                    messages: messages,
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

async function resolveAndNavigateToTransaction(
    params: {
        resolved: {
            type: 'tx',
            address: string,
            hash: string,
            lt: string
        },
        isTestnet: boolean,
        selected: SelectedAccount,
        queryClient: ReturnType<typeof useQueryClient>,
        loader: { show: () => () => void },
        navigation: TypedNavigation,
        updateAppState: (value: AppState, isTestnet: boolean) => void
    }
) {
    const { resolved, isTestnet, selected, queryClient, loader, navigation, updateAppState } = params;
    const hideloader = loader.show();

    let lt = resolved.lt;
    let hash = resolved.hash;

    try {
        if (!!selected.addressString) {
            const isSelectedAddress = selected.address.equals(Address.parse(resolved.address));
            const queryCache = queryClient.getQueryCache();
            let txs = getQueryData<InfiniteData<StoredTransaction[]>>(queryCache, Queries.Transactions(resolved.address));
            let tx = txs?.pages?.flat()?.find(tx => (tx.lt === lt && tx.hash === hash));

            if (!tx) {
                // If transaction is not found in the list, invalidate the cache and try to fetch it again
                await queryClient.invalidateQueries({
                    queryKey: Queries.Transactions(resolved.address),
                    refetchPage: (last, index, allPages) => index == 0,
                });

                txs = getQueryData<InfiniteData<StoredTransaction[]>>(queryCache, Queries.Transactions(resolved.address));
                tx = txs?.pages?.flat()?.find(tx => (tx.lt === lt && tx.hash === hash));
            }

            // If transaction is not found in the list, fetch it from the server
            if (!tx) {
                // Try to fetch transaction from the server
                const rawTxs = await infoBackoff('tx', async () => await fetchAccountTransactions(selected.addressString, isTestnet, { lt, hash }));;
                if (rawTxs.length > 0) {
                    tx = rawTxs[0];
                }
            }

            if (!!tx) {
                // Fetch metadata for all mentioned addresses
                const metadatas = (await Promise.all(
                    tx.parsed.mentioned.map(async (address) => {
                        return await queryClient.fetchQuery({
                            queryKey: Queries.ContractMetadata(address),
                            queryFn: contractMetadataQueryFn(isTestnet, address),
                        });
                    })
                ));

                // Find metadata for the base address
                const metadata = metadatas.find(m => m?.address === tx!.parsed.resolvedAddress) ?? null;
                const parsedMetadata = metadata ? parseStoredMetadata(metadata) : null;
                const jettonMaster = getJettonMasterAddressFromMetadata(metadata);
                // Fetch jetton master content
                const masterContent = jettonMaster
                    ? await queryClient.fetchQuery({
                        queryKey: Queries.Jettons().MasterContent(jettonMaster),
                        queryFn: jettonMasterContentQueryFn(jettonMaster, isTestnet),
                    })
                    : null;

                // Create tx param body
                const transaction = {
                    id: `${tx.lt}_${tx.hash}`,
                    base: tx,
                    icon: masterContent?.image?.preview256 ?? null,
                    masterMetadata: masterContent,
                    masterAddressStr: jettonMaster,
                    metadata: parsedMetadata,
                    verified: null,
                    op: null,
                    title: null
                };

                // If transaction is for the selected address, navigate to it
                if (isSelectedAddress) {
                    navigation.navigate('Transaction', { transaction });
                } else { // If transaction is for another address, navigate to the address first
                    const appState = getAppState();
                    const address = Address.parse(resolved.address);
                    const index = appState.addresses.findIndex((a) => a.address.equals(address));


                    // If address is found, select it
                    if (index !== -1) {
                        // Select new address
                        updateAppState({ ...appState, selected: index }, isTestnet);

                        // navigate to home with tx to be opened after
                        navigation.navigateAndReplaceHome({ navigateTo: { type: 'tx', transaction } });
                    }

                }
            }
        }
    } catch {
        throw Error('Failed to resolve transaction link');
    } finally {
        // Hide loader
        hideloader();
    }
}

async function resolveAndNavigateToJettonTransfer(
    params: {
        resolved: {
            type: 'jetton-transaction',
            address: Address,
            jettonMaster: Address,
            comment: string | null,
            amount: bigint | null,
            payload: Cell | null,
            feeAmount: bigint | null,
            forwardAmount: bigint | null
        },
        isTestnet: boolean,
        selected: SelectedAccount,
        queryClient: QueryClient,
        toaster: Toaster,
        loader: { show: () => () => void },
        navigation: TypedNavigation,
        toastProps?: { duration?: ToastDuration, marginBottom?: number }
    }
) {
    const { resolved, isTestnet, selected, queryClient, toaster, loader, navigation, toastProps } = params;
    const hideloader = loader.show();

    let jettonWalletAddress = queryClient.getQueryData<string | null>(Queries.Account(selected.addressString).JettonWallet());

    if (!jettonWalletAddress) {
        try {
            jettonWalletAddress = await queryClient.fetchQuery({
                queryKey: Queries.Jettons().Address(selected!.addressString).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                queryFn: jettonWalletAddressQueryFn(resolved.jettonMaster.toString({ testOnly: isTestnet }), selected!.addressString, isTestnet)
            });
        } catch {
            console.warn('Failed to fetch jetton wallet address', selected!.addressString, resolved.jettonMaster.toString({ testOnly: isTestnet }));
        }
    }

    if (!jettonWalletAddress) {
        toaster.show({
            message: t('transfer.wrongJettonTitle'),
            ...toastProps, type: 'error'
        });
        hideloader();
        return;
    }

    let jettonWallet = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(jettonWalletAddress!).JettonWallet());

    if (!jettonWallet) {
        try {
            jettonWallet = await queryClient.fetchQuery({
                queryKey: Queries.Account(jettonWalletAddress!).JettonWallet(),
                queryFn: jettonWalletQueryFn(jettonWalletAddress!, isTestnet),
            });
        } catch {
            console.warn('Failed to fetch jetton wallet', jettonWalletAddress);
        }
    }

    if (!jettonWallet) {
        toaster.show({
            message: t('transfer.wrongJettonMessage'),
            ...toastProps, type: 'error'
        });
        hideloader();
        return;
    }

    hideloader();

    navigation.navigateSimpleTransfer({
        target: resolved.address.toString({ testOnly: isTestnet }),
        comment: resolved.comment,
        amount: resolved.amount,
        stateInit: null,
        job: null,
        jetton: Address.parse(jettonWalletAddress),
        callback: null,
        payload: resolved.payload,
        feeAmount: resolved.feeAmount,
        forwardAmount: resolved.forwardAmount,
    });
}

function getNeedsEnrollment(url: string, address: string, isTestnet: boolean, queryClient: QueryClient) {

    if (!getHoldersToken(address)) {
        return false;
    }

    const queryCache = queryClient.getQueryCache();
    const status = getQueryData<HoldersAccountStatus>(queryCache, Queries.Holders(address).Status());
    const isHoldersReady = getIsConnectAppReady(url, isTestnet, address);

    if (!isHoldersReady) {
        return true;
    }

    if (!status) {
        return true;
    }

    if (status.state === HoldersUserState.NeedEnrollment) {
        return true;
    }

    return false;
}

type HolderResloveParams = {
    query: { [key: string]: string | undefined },
    navigation: TypedNavigation,
    selected: SelectedAccount,
    updateAppState: (value: AppState, isTestnet: boolean) => void,
    isTestnet: boolean,
    queryClient: QueryClient
}

type HoldersTransactionResolveParams = HolderResloveParams & { type: 'holders-transactions' }
type HoldersPathResolveParams = HolderResloveParams & { type: 'holders-path', path: string }

function resolveAndNavigateToHolders(params: HoldersTransactionResolveParams | HoldersPathResolveParams) {
    const { type, query, navigation, selected, updateAppState, queryClient, isTestnet } = params
    const addresses = query['addresses']?.split(',');

    if (!addresses || addresses.length === 0) {
        return;
    }

    const isSelectedAddress = addresses.find((a) => Address.parse(a).equals(selected.address));
    const transactionId = query['transactionId'];

    const holdersNavParams: HoldersAppParams = type === 'holders-transactions'
        ? {
            type: HoldersAppParamsType.Transactions,
            query: { transactionId }
        } : {
            type: HoldersAppParamsType.Path,
            path: params.path,
            query
        }

    const url = holdersUrl(isTestnet);

    if (isSelectedAddress) {
        const normalizedAddress = selected.address.toString({ testOnly: isTestnet });
        const needsEnrollment = getNeedsEnrollment(url, normalizedAddress, isTestnet, queryClient);

        if (needsEnrollment) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: holdersNavParams }, isTestnet);
            return;
        }

        navigation.navigateHolders(holdersNavParams, isTestnet);

    } else { // If transaction is for another address, navigate to the address first
        const appState = getAppState();
        const index = appState.addresses.findIndex((a) => {
            return addresses.find((addr) => a.address.equals(Address.parse(addr))) !== undefined;
        });


        // If address is found, select it
        if (index !== -1) {
            // Select new address
            updateAppState({ ...appState, selected: index }, isTestnet);
            const normalizedAddress = appState.addresses[index].address.toString({ testOnly: isTestnet });
            const needsEnrollment = getNeedsEnrollment(url, normalizedAddress, isTestnet, queryClient);

            if (needsEnrollment) {
                navigation.navigateAndReplaceHome({
                    navigateTo: {
                        type: 'holders-landing',
                        endpoint: url,
                        onEnrollType: holdersNavParams
                    }
                });
                return;
            }

            // navigate to home with tx to be opened after
            navigation.navigateAndReplaceHome({
                navigateTo: {
                    type: 'holders-app',
                    params: holdersNavParams
                }
            });
        }
    }
}

function resolveHoldersInviteLink(params: {
    navigation: TypedNavigation,
    isTestnet: boolean,
    inviteId: string
}) {
    const { navigation, isTestnet, inviteId } = params

    const endpoint = holdersUrl(isTestnet);

    navigation.navigateHoldersLanding({ endpoint, onEnrollType: { type: HoldersAppParamsType.Invite }, inviteId }, isTestnet);
}

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number },
    tonconnectType: TonConnectAuthType = TonConnectAuthType.Qr
) {
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const toaster = useToaster();
    const loader = useGlobalLoader();

    const [, updatePendingReuests] = useConnectPendingRequests();
    const pendingReqsUpdaterRef = useRef(updatePendingReuests);

    useEffect(() => {
        pendingReqsUpdaterRef.current = updatePendingReuests;
    }, [updatePendingReuests]);

    // TODO: split this function into smaller functions
    const handler = useCallback(async (resolved: ResolvedUrl) => {
        switch (resolved.type) {
            case 'transaction': {
                if (resolved.payload) {
                    navigation.navigateTransfer({
                        order: {
                            type: 'order',
                            messages: [{
                                target: resolved.address.toString({ testOnly: isTestnet }),
                                amount: resolved.amount || BigInt(0),
                                amountAll: false,
                                stateInit: resolved.stateInit,
                                payload: resolved.payload,
                            }]
                        },
                        text: resolved.comment,
                        job: null,
                        callback: null
                    });
                } else {
                    navigation.navigateSimpleTransfer({
                        target: resolved.address.toString({ testOnly: isTestnet }),
                        comment: resolved.comment,
                        amount: resolved.amount,
                        stateInit: resolved.stateInit,
                        job: null,
                        jetton: null,
                        callback: null
                    });
                }
                break;
            }
            case 'jetton-transaction': {
                if (!selected) {
                    return;
                }

                await resolveAndNavigateToJettonTransfer({
                    resolved,
                    isTestnet,
                    selected,
                    queryClient,
                    toaster,
                    loader,
                    navigation,
                    toastProps
                });
                break;
            }
            case 'connect': {
                navigation.navigate('Authenticate', {
                    session: resolved.session,
                    endpoint: resolved.endpoint
                });
                break;
            }
            case 'tonconnect': {
                if (tonconnectType === TonConnectAuthType.Qr || tonconnectType === TonConnectAuthType.Link) {
                    navigation.navigateConnectAuth({ query: resolved.query, type: tonconnectType });
                } else { // Callback only support in injectedBridge
                    warn(`Unsupported TonConnectAuthType ${tonconnectType}`);
                }
                break;
            }
            case 'install': {
                navigation.navigate('Install', {
                    url: resolved.url,
                    title: resolved.customTitle,
                    image: resolved.customImage
                });
                break;
            }
            case 'tx': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToTransaction({
                    resolved,
                    isTestnet,
                    selected,
                    queryClient,
                    loader,
                    navigation,
                    updateAppState
                });
                break;
            }
            case 'tonconnect-request': {
                tryResolveTonconnectRequest({
                    query: resolved.query,
                    isTestnet,
                    toaster,
                    toastProps,
                    navigation,
                    pendingReqsUpdaterRef,
                    updateAppState
                });
                break;
            }
            case 'external-url': {
                Linking.openURL(resolved.url);
                break;
            }
            case 'in-app-url': {
                openWithInApp(resolved.url);
                break;
            }
            case 'holders-transactions': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToHolders({
                    type: 'holders-transactions',
                    navigation,
                    query: resolved.query,
                    selected,
                    updateAppState,
                    isTestnet,
                    queryClient
                });
                break;
            }
            case 'holders-path': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToHolders({
                    type: 'holders-path',
                    path: resolved.path,
                    navigation,
                    query: resolved.query,
                    selected,
                    updateAppState,
                    isTestnet,
                    queryClient
                });
                break;
            }
            case 'holders-invite': {
                if (!selected) {
                    return;
                }

                resolveHoldersInviteLink({
                    navigation,
                    isTestnet,
                    inviteId: resolved.inviteId
                })
                break;
            }
        }

    }, [selected, updateAppState]);

    return handler;
}
