import { t } from './i18n/t';
import { TypedNavigation, useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useConnectPendingRequests, useSetAppState } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';
import { Address, Cell, fromNano, toNano } from '@ton/core';
import { fetchAccountTransactions } from './engine/api/fetchAccountTransactions';
import { AppState, getAppState } from './storage/appState';
import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { ToastDuration, Toaster, useToaster } from './components/toast/ToastProvider';
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from './engine/hooks/jettons/jettonsBatcher';
import { useGlobalLoader } from './components/useGlobalLoader';
import { StoredJettonWallet } from './engine/metadata/StoredMetadata';
import { createBackoff } from './utils/time';
import { getQueryData } from './engine/utils/getQueryData';
import { AccountStoredTransaction, SelectedAccount, TonTransaction, TransactionType } from './engine/types';
import { TonConnectAuthType } from './fragments/secure/dapps/TonConnectAuthenticateFragment';
import { warn } from './utils/log';
import { getFullConnectionsMap, getStoredConnectExtensions } from './engine/state/tonconnect';
import { ConnectedAppConnectionRemote, ConnectPushQuery, SendTransactionError, SendTransactionRequest, SignRawParams, TonConnectBridgeType } from './engine/tonconnect/types';
import { AppRequest, Base64, CHAIN, hexToByteArray, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from '@tonconnect/protocol';
import { transactionRpcRequestCodec } from './engine/tonconnect/codecs';
import { sendTonConnectResponse } from './engine/api/sendTonConnectResponse';
import { extensionKey } from './engine/hooks/dapps/useAddExtension';
import { ConnectedApp } from './engine/hooks/dapps/useTonConnectExtenstions';
import { extractDomain } from './engine/utils/extractDomain';
import { Linking } from 'react-native';
import { openWithInApp } from './utils/openWithInApp';
import { getHoldersToken, HoldersAccountStatus } from './engine/hooks/holders/useHoldersAccountStatus';
import { HoldersUserState, holdersUrl } from './engine/api/holders/fetchUserState';
import { getIsConnectAppReady } from './engine/hooks/dapps/useIsConnectAppReady';
import { HoldersAppParams, HoldersAppParamsType } from './fragments/holders/HoldersAppFragment';
import { sharedStoragePersistence } from './storage/storage';
import { TransferFragmentParams } from './fragments/secure/transfer/TransferFragment';
import { useLedgerTransport } from './fragments/ledger/components/TransportContext';
import { TransferRequestURL, TransactionRequestURL } from '@solana/pay';
import { z } from 'zod';
import axios from 'axios';
import { SolanaOrderApp } from './fragments/secure/ops/Order';
import { solanaAddressFromPublicKey } from './utils/solana/address';
import { Transaction, PublicKey } from '@solana/web3.js';
import { checkTonconnectRequest } from './engine/tonconnect/utils';

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
            const isValidRequest = checkTonconnectRequest(request.id.toString(), params, callback, isTestnet, toaster);

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
        if (selected && !!selected.addressString) {
            const isSelectedAddress = selected.address.equals(Address.parse(resolved.address));
            const queryCache = queryClient.getQueryCache();
            const holdersStatusKey = Queries.Holders(resolved.address).Status();
            const holdersStatusData = getQueryData<HoldersAccountStatus>(queryCache, holdersStatusKey);

            const token = (
                !!holdersStatusData &&
                holdersStatusData.state === HoldersUserState.Ok
            ) ? holdersStatusData.token : null;

            let txsV2 = getQueryData<InfiniteData<AccountStoredTransaction[]>>(queryCache, Queries.TransactionsV2(resolved.address, !!token));
            // let txs = getQueryData<InfiniteData<StoredTransaction[]>>(queryCache, Queries.Transactions(resolved.address));
            let transaction = txsV2?.pages?.flat()?.find(tx => tx.type === TransactionType.TON && (tx.data.lt === lt && tx.data.hash === hash))?.data as TonTransaction | undefined

            if (!transaction) {
                await queryClient.invalidateQueries({
                    queryKey: Queries.TransactionsV2(resolved.address, !!token),
                    refetchPage: (last, index, allPages) => index == 0,
                });

                txsV2 = getQueryData<InfiniteData<AccountStoredTransaction[]>>(queryCache, Queries.TransactionsV2(resolved.address, !!token));
                transaction = txsV2?.pages?.flat()?.find(tx => tx.type === TransactionType.TON && (tx.data.lt === lt && tx.data.hash === hash))?.data as TonTransaction | undefined;
            }

            // If transaction is not found in the list, fetch it from the server
            if (!transaction) {
                // Try to fetch transaction from the server
                const rawTxs = await infoBackoff('tx', async () => await fetchAccountTransactions(resolved.address, isTestnet, { lt, hash }));
                if (rawTxs.length > 0 && !!rawTxs[0]) {
                    const base = rawTxs[0];
                    transaction = {
                        id: `${base.lt}_${base.hash}`,
                        base: base,
                        outMessagesCount: base.outMessagesCount,
                        outMessages: base.outMessages,
                        lt: base.lt,
                        hash: base.hash
                    };
                }
            }

            if (!!transaction) {
                // If transaction is for the selected address, navigate to it
                if (isSelectedAddress) {
                    navigation.navigateTonTransaction(transaction);
                } else { // If transaction is for another address, navigate to the address first
                    const appState = getAppState();
                    const address = Address.parse(resolved.address);
                    const index = appState.addresses.findIndex((a) => a.address.equals(address));

                    // If address is found, select it
                    if (index !== -1) {
                        // Select new address
                        updateAppState({ ...appState, selected: index }, isTestnet);

                        // await 1 second in case of app state is not updated yet (should never happen)
                        await new Promise(resolve => setTimeout(resolve, 1000));

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
            isBounceable?: boolean,
            jettonMaster: Address,
            comment: string | null,
            amount: bigint | null,
            payload: Cell | null,
            feeAmount: bigint | null,
            forwardAmount: bigint | null
        },
        isTestnet: boolean,
        isLedger?: boolean,
        address: string,
        queryClient: QueryClient,
        toaster: Toaster,
        loader: { show: () => () => void },
        navigation: TypedNavigation,
        toastProps?: { duration?: ToastDuration, marginBottom?: number }
    }
) {
    const { resolved, isTestnet, address, queryClient, toaster, loader, navigation, toastProps, isLedger } = params;
    const hideloader = loader.show();

    let jettonWalletAddress = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(address).JettonWallet())?.address;

    if (!jettonWalletAddress) {
        try {
            jettonWalletAddress = await queryClient.fetchQuery({
                queryKey: Queries.Jettons().Address(address).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                queryFn: jettonWalletAddressQueryFn(resolved.jettonMaster.toString({ testOnly: isTestnet }), address, isTestnet)
            });
        } catch {
            console.warn('Failed to fetch jetton wallet address', address, resolved.jettonMaster.toString({ testOnly: isTestnet }));
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

    const bounceable = resolved.isBounceable ?? true;

    navigation.navigateSimpleTransfer({
        target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
        comment: resolved.comment,
        amount: resolved.amount,
        stateInit: null,
        asset: { type: 'jetton', master: resolved.jettonMaster, wallet: Address.parse(jettonWalletAddress) },
        callback: null,
        payload: resolved.payload,
        feeAmount: resolved.feeAmount,
        forwardAmount: resolved.forwardAmount,
        unknownDecimals: true,
    }, { ledger: isLedger });
}

function getNeedsEnrollment(url: string, address: string, isTestnet: boolean, queryClient: QueryClient) {

    if (!getHoldersToken(address)) {
        return true;
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

    const solanaAddress = solanaAddressFromPublicKey(selected.publicKey);
    const isSelectedAddress = addresses?.find((a) => {
        try {
            return Address.parse(a).equals(selected.address);
        } catch {
            try {
                const solPub = new PublicKey(a);
                return solPub.equals(solanaAddress);
            } catch {
                return false;
            }
        }
    });
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

    if (isSelectedAddress || !addresses || addresses.length === 0) {
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
            let tonAddressFound = false;
            let solanaAddressFound = false;
            addresses.forEach((addr) => {
                try {
                    tonAddressFound = a.address.equals(Address.parse(addr));
                } catch {
                    try {
                        const solPub = new PublicKey(addr);
                        solanaAddressFound = solPub.equals(solanaAddressFromPublicKey(a.publicKey));
                    } catch { }
                }
            });
            return tonAddressFound || solanaAddressFound;
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

const solanaAppDataShema = z.object({
    label: z.string(),
    icon: z.string()
});

const solanaTransactionSchema = z.object({
    transaction: z.string(),
    message: z.string()
});

async function resolveTransactionRequestURL(request: TransactionRequestURL, navigation: TypedNavigation, selected: SelectedAccount) {
    const link = request.link;
    const getRes = await axios.get(link.toString());

    const data = getRes.data;
    const parsed = solanaAppDataShema.safeParse(data);

    let solanaAppData: SolanaOrderApp | undefined;

    if (parsed.success) {
        let domain: string | undefined;
        try {
            domain = extractDomain(link.toString());
        } catch { }

        solanaAppData = {
            label: parsed.data.label,
            image: parsed.data.icon,
            domain
        };
    }

    const solanaAddress = solanaAddressFromPublicKey(selected.publicKey);
    const postRes = await axios.post(link.toString(), {
        account: solanaAddress.toString()
    });

    const postData = postRes.data;
    const postParsed = solanaTransactionSchema.safeParse(postData);

    if (postParsed.success) {
        if (solanaAppData) {
            solanaAppData.message = postParsed.data.message;
        }
        try {
            const transaction = postParsed.data.transaction;
            Transaction.from(Buffer.from(transaction, 'base64'));
            navigation.navigateSolanaTransfer({
                type: 'transaction',
                transaction,
                app: solanaAppData
            });
        } catch { }
    }
}

async function resolveAndNavigateToSolanaTransfer(params: {
    selected: SelectedAccount | null,
    navigation: TypedNavigation,
    isTestnet: boolean,
    request: TransactionRequestURL | TransferRequestURL
}) {
    const { selected, navigation, request } = params;

    if (!!(request as unknown as any).link) {
        const transaction = request as TransactionRequestURL;
        if (selected) {
            resolveTransactionRequestURL(transaction, navigation, selected);
        }
    } else {
        const transfer = request as TransferRequestURL;
        navigation.navigateSolanaTransfer({
            type: 'order',
            order: {
                type: 'solana',
                target: transfer.recipient.toString(),
                comment: transfer.memo ?? null,
                amount: BigInt(transfer.amount?.toString() ?? '0'),
                token: transfer.splToken ? { mint: transfer.splToken.toString() } : null,
                reference: transfer.reference,
                app: {
                    label: transfer.label,
                    message: transfer.message
                }
            },
        });
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

const inviteIdKey = 'inviteId';

export function getInviteId(): string | undefined {
    return sharedStoragePersistence.getString(inviteIdKey);
}

export function storeInviteId(inviteId: string) {
    sharedStoragePersistence.set(inviteIdKey, inviteId);
}

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number },
    tonconnectType: TonConnectAuthType = TonConnectAuthType.Qr,
    isLedger?: boolean
) {
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const toaster = useToaster();
    const loader = useGlobalLoader();
    const ledgerContext = useLedgerTransport();
    const address = isLedger ? ledgerContext.addr!.address : selected?.addressString;

    const [, updatePendingReuests] = useConnectPendingRequests();
    const pendingReqsUpdaterRef = useRef(updatePendingReuests);

    useEffect(() => {
        pendingReqsUpdaterRef.current = updatePendingReuests;
    }, [updatePendingReuests]);

    // TODO: split this function into smaller functions
    const handler = useCallback(async (resolved: ResolvedUrl) => {
        switch (resolved.type) {
            case 'transaction': {
                const bounceable = resolved.isBounceable ?? true;
                if (resolved.payload) {
                    navigation.navigateTransfer({
                        order: {
                            type: 'order',
                            messages: [{
                                target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
                                amount: resolved.amount || BigInt(0),
                                amountAll: false,
                                stateInit: resolved.stateInit,
                                payload: resolved.payload,
                            }]
                        },
                        text: resolved.comment,
                        callback: null
                    });
                } else {
                    navigation.navigateSimpleTransfer({
                        target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
                        comment: resolved.comment,
                        amount: resolved.amount,
                        stateInit: resolved.stateInit,
                        asset: null,
                        callback: null
                    });
                }
                break;
            }
            case 'jetton-transaction': {
                if (!address) {
                    return;
                }

                await resolveAndNavigateToJettonTransfer({
                    resolved,
                    isTestnet,
                    address,
                    queryClient,
                    toaster,
                    loader,
                    navigation,
                    toastProps,
                    isLedger
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
                storeInviteId(resolved.inviteId);

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
            case 'solana-transfer': {
                resolveAndNavigateToSolanaTransfer({
                    selected,
                    navigation,
                    isTestnet,
                    request: resolved.request
                });
                break;
            }
        }

    }, [selected, updateAppState]);

    return handler;
}
