import * as React from 'react';
import { BackHandler, Linking } from "react-native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getAppInstanceKeyPair, getCurrentAddress } from '../../../storage/appState';
import { contractFromPublicKey, walletConfigFromContract } from '../../../engine/contractFromPublicKey';
import { beginCell, safeSign, storeStateInit } from '@ton/core';
import { WalletKeys } from '../../../storage/walletKeys';
import { fragment } from '../../../fragment';
import { warn } from '../../../utils/log';
import { ConnectEvent, ConnectItemReply, ConnectRequest, SessionCrypto } from '@tonconnect/protocol';
import { AppManifest } from '../../../engine/api/fetchManifest';
import { useParams } from '../../../utils/useParams';
import { connectAnswer } from '../../../engine/api/connectAnswer';
import { sendTonConnectResponse } from '../../../engine/api/sendTonConnectResponse';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useNetwork, useTheme } from '../../../engine/hooks';
import { handleConnectDeeplink, HandledConnectRequest, isValidDappDomain } from '../../../engine/tonconnect/handleConnectDeeplink';
import { isUrl } from '../../../utils/resolveUrl';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { getAppManifest } from '../../../engine/getters/getAppManifest';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSaveAppConnection } from '../../../engine/hooks';
import { checkProtocolVersionCapability, resolveAuthError, verifyConnectRequest } from '../../../engine/tonconnect/utils';
import { ConnectQrQuery, ReturnStrategy, TonConnectBridgeType } from '../../../engine/tonconnect/types';
import { ConnectReplyBuilder } from '../../../engine/tonconnect/ConnectReplyBuilder';
import { tonConnectDeviceInfo } from '../../../engine/tonconnect/config';
import { DappAuthComponent, TonConnectSignState } from './DappAuthComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Minimizer from '../../../modules/Minimizer';
import { SelectedAccount } from '../../../engine/types';
import { ToastDuration, useToaster } from '../../../components/toast/ToastProvider';
import { t } from '../../../i18n/t';
import { useWalletVersion } from '../../../engine/hooks/useWalletVersion';

const SignStateLoader = memo(({ connectProps }: { connectProps: TonConnectAuthProps }) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const toaster = useToaster();
    const [state, setState] = useState<TonConnectSignState>({ type: 'loading' });
    const saveAppConnection = useSaveAppConnection();
    const walletVersion = useWalletVersion();
    const toastMargin = safeArea.bottom + 56 + 48;

    useEffect(() => {
        (async () => {
            // remote bridge
            if (connectProps.type === 'qr' || connectProps.type === 'link') {
                try {
                    const handledDeeplink = await handleConnectDeeplink(connectProps.query);

                    if (handledDeeplink.type === 'invalid-manifest') {
                        setState({ type: 'invalid-manifest', returnStrategy: connectProps.query.ret });
                        return;
                    }

                    const handled = handledDeeplink as HandledConnectRequest;

                    if (handled) {
                        checkProtocolVersionCapability(handled.protocolVersion);
                        verifyConnectRequest(handled.request);

                        const manifest = handled.manifest;
                        const manifestUrl = handled.manifestUrl;
                        if (manifest) {
                            const dAppUrl = manifest.url;
                            const domain = isUrl(dAppUrl) ? extractDomain(dAppUrl) : dAppUrl;

                            if (!isValidDappDomain(domain)) {
                                setState({ type: 'invalid-manifest', returnStrategy: connectProps.query.ret });
                                return;
                            }

                            setState({
                                type: 'initing',
                                name: manifest.name,
                                url: dAppUrl,
                                app: manifest,
                                protocolVersion: handled.protocolVersion,
                                request: handled.request,
                                clientSessionId: handled.clientSessionId,
                                returnStrategy: handled.returnStrategy,
                                domain,
                                manifestUrl
                            });
                            return;
                        }
                        setState({ type: 'failed', returnStrategy: connectProps.query.ret });
                        return;
                    }

                } catch (e) {
                    warn('Failed to handle deeplink');
                }
                return;
            }

            // continue with local injected bridge
            checkProtocolVersionCapability(connectProps.protocolVersion);
            verifyConnectRequest(connectProps.request);

            const manifest = await getAppManifest(connectProps.request.manifestUrl);

            if (manifest) {
                const domain = isUrl(manifest.url) ? extractDomain(manifest.url) : manifest.url;

                setState({
                    type: 'initing',
                    name: manifest.name,
                    url: manifest.url,
                    app: manifest,
                    protocolVersion: connectProps.protocolVersion,
                    request: connectProps.request,
                    domain: domain,
                    manifestUrl: connectProps.request.manifestUrl
                });
                return;
            }

            setState({ type: 'failed' });
            return;

        })()
    }, []);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Approve
    const active = useRef(true);

    const navigate = useRef(() => {
        active.current = false;
        navigation.goBack();
    });

    const handleReturnStrategy = useCallback((returnStrategy: string) => {
        if (returnStrategy === 'back') {
            Minimizer.goBack();
        } else if (returnStrategy !== 'none') {
            try {
                const url = new URL(decodeURIComponent(returnStrategy));
                Linking.openURL(url.toString());
            } catch {
                warn('Failed to open url');
            }
        }
    }, []);

    useEffect(() => {
        // default to go back
        if (state.type !== 'initing' || connectProps.type === TonConnectAuthType.Callback) {
            return;
        }

        navigate.current = () => {
            if (!active.current) {
                return;
            }
            active.current = false;

            // close modal
            navigation.goBack();

            // resolve return strategy
            if (!!state.returnStrategy) {
                handleReturnStrategy(state.returnStrategy);
            }
        };

    }, [connectProps.type, state.type]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (connectProps.type === 'callback') {
                return false;
            }

            const returnStrategy = connectProps.query.ret;

            // close modal
            navigation.goBack();

            // resolve return strategy
            if (!!returnStrategy) {
                handleReturnStrategy(returnStrategy);
            }

            return true;
        });

        return () => {
            backHandler.remove();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (!active.current) {
                return;
            }

            active.current = false;

            // reject on cancel
            if (connectProps.type === 'callback' && !!connectProps.callback) {
                connectProps.callback({ ok: false });
            }
        }
    }, []);

    const approve = useCallback(async (selectedAccount?: SelectedAccount) => {

        if (state.type !== 'initing') {
            return;
        }

        // Create new session
        const sessionCrypto = new SessionCrypto();

        if (state.protocolVersion === 1) {
            setState({ type: 'failed', returnStrategy: state.returnStrategy });
        }

        try {
            const acc = selectedAccount ?? getCurrentAddress();
            const contract = contractFromPublicKey(acc.publicKey, walletVersion, isTestnet);
            const config = walletConfigFromContract(contract);

            const walletConfig = config.walletConfig;
            const walletType = config.type;

            let address = contract.address.toString({ testOnly: isTestnet });
            let appInstanceKeyPair = await getAppInstanceKeyPair();

            // Sign
            let walletKeys: WalletKeys;
            try {
                walletKeys = await authContext.authenticate({
                    cancelable: true,
                    backgroundColor: theme.elevation,
                    containerStyle: { paddingBottom: safeArea.bottom + 56 },
                    selectedAccount: acc
                });
            } catch {
                warn('Failed to load wallet keys');
                return;
            }

            const initialCode = contract.init.code;
            const initialData = contract.init.data;
            const stateInitCell = beginCell().store(storeStateInit({ code: initialCode, data: initialData })).endCell();
            const stateInitStr = stateInitCell.toBoc({ idx: false }).toString('base64');
            const replyBuilder = new ConnectReplyBuilder(state.request, state.app);

            let replyItems: ConnectItemReply[];
            try {
                replyItems = replyBuilder.createReplyItems(
                    acc.address.toString({ testOnly: isTestnet, urlSafe: true, bounceable: true }),
                    Uint8Array.from(walletKeys.keyPair.secretKey),
                    Uint8Array.from(walletKeys.keyPair.publicKey),
                    stateInitStr,
                    isTestnet
                );
            } catch {
                warn('Failed to create reply items');
                return;
            }

            if (
                (connectProps.type === TonConnectAuthType.Qr || connectProps.type === TonConnectAuthType.Link)
                && state.clientSessionId
            ) {
                const response = {
                    event: 'connect',
                    payload: {
                        items: replyItems,
                        device: tonConnectDeviceInfo(walletVersion),
                    }
                } as ConnectEvent

                // Sign clientSessionId
                let toSign = beginCell()
                    .storeCoins(0)
                    .storeBuffer(Buffer.from(state.clientSessionId, 'hex'))
                    .storeAddress(contract.address)
                    .storeMaybeRef(beginCell()
                        .storeBuffer(Buffer.from(state.app.url))
                        .endCell())
                    .storeRef(beginCell()
                        .storeBuffer(appInstanceKeyPair.publicKey)
                        .endCell())
                    .endCell();
                let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

                // Report answer
                await connectAnswer({
                    reportEndpoint: 'connect.tonhubapi.com',
                    key: Buffer.from(state.clientSessionId, 'hex').toString('base64'),
                    appPublicKey: appInstanceKeyPair.publicKey.toString('base64'),
                    address: address,
                    walletType,
                    walletConfig,
                    walletSig: signature.toString('base64'),
                    endpoint: state.app.url,
                    name: state.app.name,
                    kind: 'tonconnect-v2',
                    testnet: isTestnet
                });

                // Save connection
                saveAppConnection({
                    address: acc.address.toString({ testOnly: isTestnet }),
                    app: {
                        name: state.app.name,
                        url: state.app.url,
                        iconUrl: state.app.iconUrl,
                        autoConnectDisabled: false,
                        manifestUrl: state.manifestUrl
                    },
                    connections: [
                        {
                            type: TonConnectBridgeType.Remote,
                            sessionKeyPair: sessionCrypto.stringifyKeypair(),
                            clientSessionId: state.clientSessionId,
                            replyItems,
                        },
                        {
                            type: TonConnectBridgeType.Injected,
                            replyItems,
                        }
                    ],
                });

                // Send connect response
                await sendTonConnectResponse({ response, sessionCrypto, clientSessionId: state.clientSessionId });

                toaster.show({
                    type: 'success',
                    message: t('products.tonConnect.successAuth'),
                    onDestroy: () => {
                        navigate.current();
                    },
                    duration: ToastDuration.SHORT,
                    marginBottom: toastMargin
                });
                return;
            } else if (connectProps.type === TonConnectAuthType.Callback) {
                toaster.show({
                    type: 'success',
                    message: t('products.tonConnect.successAuth'),
                    onDestroy: () => {
                        connectProps.callback({ ok: true, replyItems });

                        timerRef.current = setTimeout(() => {
                            navigate.current();
                        }, 50);
                    },
                    duration: ToastDuration.SHORT,
                    marginBottom: toastMargin
                });
                return;
            }

            // Should not happen
            setState({ type: 'failed', returnStrategy: state.returnStrategy });
        } catch (e) {
            const message = resolveAuthError(e as Error);

            // Show user error toast
            toaster.show({
                type: 'error',
                message: message,
                marginBottom: toastMargin
            });

            warn('Failed to approve');
        }

    }, [state, saveAppConnection, toaster, walletVersion]);

    return (
        <DappAuthComponent
            state={{ ...state, connector: 'ton-connect' }}
            onApprove={approve}
            onCancel={() => {
                navigate.current();
            }}
            single={connectProps.type === 'callback'}
        />
    )
});

export type TonConnectAuthResult = { replyItems: ConnectItemReply[], ok: true } | { ok: false }

export enum TonConnectAuthType {
    Qr = 'qr',
    Callback = 'callback',
    Link = 'link'
}

export type TonConnectAuthProps = {
    query: ConnectQrQuery,
    type: TonConnectAuthType.Qr,
} | {
    type: TonConnectAuthType.Callback,
    protocolVersion: number,
    request: ConnectRequest,
    callback: (result: TonConnectAuthResult) => void
} | {
    type: TonConnectAuthType.Link,
    query: ConnectQrQuery
}

export const TonConnectAuthenticateFragment = fragment(() => {
    const props = useParams<TonConnectAuthProps>();

    return (<SignStateLoader connectProps={props} />);
});