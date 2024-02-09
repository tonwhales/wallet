import * as React from 'react';
import { Linking } from "react-native";
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
import { handleConnectDeeplink } from '../../../engine/tonconnect/handleConnectDeeplink';
import { isUrl } from '../../../utils/resolveUrl';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { getAppManifest } from '../../../engine/getters/getAppManifest';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSaveAppConnection } from '../../../engine/hooks';
import { checkProtocolVersionCapability, verifyConnectRequest } from '../../../engine/tonconnect/utils';
import { ConnectQrQuery, ReturnStrategy, TonConnectBridgeType } from '../../../engine/tonconnect/types';
import { ConnectReplyBuilder } from '../../../engine/tonconnect/ConnectReplyBuilder';
import { tonConnectDeviceInfo } from '../../../engine/tonconnect/config';
import { DappAuthComponent } from './DappAuthComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Minimizer from '../../../modules/Minimizer';

type SignState = { type: 'loading' }
    | { type: 'expired', returnStrategy?: ReturnStrategy }
    | {
        type: 'initing',
        name: string,
        url: string,
        app: AppManifest,
        protocolVersion: number,
        request: ConnectRequest,
        clientSessionId?: string,
        returnStrategy?: ReturnStrategy,
        domain: string,
        manifestUrl: string
    }
    | { type: 'completed', returnStrategy?: ReturnStrategy }
    | { type: 'authorized', returnStrategy?: ReturnStrategy }
    | { type: 'failed', returnStrategy?: ReturnStrategy }

const SignStateLoader = memo(({ connectProps }: { connectProps: TonConnectAuthProps }) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const [state, setState] = useState<SignState>({ type: 'loading' });
    const saveAppConnection = useSaveAppConnection();

    useEffect(() => {
        (async () => {
            if (connectProps.type === 'qr') {
                try {
                    const handled = await handleConnectDeeplink(connectProps.query);

                    if (handled) {
                        checkProtocolVersionCapability(handled.protocolVersion);
                        verifyConnectRequest(handled.request);

                        if (handled.manifest) {
                            const domain = isUrl(handled.manifest.url) ? extractDomain(handled.manifest.url) : handled.manifest.url;

                            setState({
                                type: 'initing',
                                name: handled.manifest.name,
                                url: handled.manifest.url,
                                app: handled.manifest,
                                protocolVersion: handled.protocolVersion,
                                request: handled.request,
                                clientSessionId: handled.clientSessionId,
                                returnStrategy: handled.returnStrategy,
                                domain: domain,
                                manifestUrl: handled.manifestUrl
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

    // Approve
    const acc = useMemo(() => getCurrentAddress(), []);
    let active = useRef(true);
    useEffect(() => {
        return () => { active.current = false; };
    }, []);

    const approve = useCallback(async () => {

        if (state.type !== 'initing') {
            return;
        }

        // Create new session
        const sessionCrypto = new SessionCrypto();

        if (state.protocolVersion === 1) {
            setState({ type: 'failed', returnStrategy: state.returnStrategy });
        }

        try {
            const contract = contractFromPublicKey(acc.publicKey);
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
                });
            } catch (e) {
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
            } catch (e) {
                warn('Failed to create reply items');
                return;
            }

            if (connectProps.type === 'qr' && state.clientSessionId) {
                const response = {
                    event: 'connect',
                    payload: {
                        items: replyItems,
                        device: tonConnectDeviceInfo,
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

                navigation.goBack();

                return;
            } else if (connectProps.type === 'callback') {
                connectProps.callback({ ok: true, replyItems });

                setTimeout(() => {
                    if (!!state.returnStrategy) {
                        if (state.returnStrategy === 'back') {
                            Minimizer.goBack();
                            return;
                        } else if (state.returnStrategy !== 'none') {
                            try {
                                const url = new URL(state.returnStrategy);
                                Linking.openURL(url.toString());
                            } catch (e) {
                                warn('Failed to open url');
                            }
                        }
                    }

                    navigation.goBack();
                }, 50);

                return;
            }

            // Should not happen
            setState({ type: 'failed', returnStrategy: state.returnStrategy });
        } catch (e) {
            warn('Failed to approve');
            setState({ type: 'failed', returnStrategy: state.returnStrategy });
        }

    }, [state, saveAppConnection]);

    const onCancel = useCallback(() => {
        if (state.type === 'loading') {
            navigation.goBack();
            return;
        }
        if (state.returnStrategy && state.returnStrategy !== 'none' && state.returnStrategy !== 'back') {
            try {
                const url = new URL(state.returnStrategy);
                Linking.openURL(url.toString());
                return;
            } catch (e) {
                warn('Failed to open url');
            }
            navigation.goBack();
            return;
        }
        navigation.goBack();
    }, [state]);

    return (
        <DappAuthComponent
            state={{ ...state, connector: 'ton-connect' }}
            onApprove={approve}
            onCancel={onCancel}
        />
    )
});

export type TonConnectAuthResult = { replyItems: ConnectItemReply[], ok: true } | { ok: false }

export type TonConnectAuthProps = {
    query: ConnectQrQuery,
    type: 'qr'
} | {
    type: 'callback',
    protocolVersion: number,
    request: ConnectRequest,
    callback: (result: TonConnectAuthResult) => void
}

export const TonConnectAuthenticateFragment = fragment(() => {
    const props = useParams<TonConnectAuthProps>();

    useEffect(() => {
        return () => {
            if (props && props.type === 'callback' && props.callback) {
                props.callback({ ok: false });
            }
        }
    }, []);

    return (<SignStateLoader connectProps={props} />);
});