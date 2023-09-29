import * as React from 'react';
import { Platform, Linking } from "react-native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAppInstanceKeyPair, getCurrentAddress } from '../../../storage/appState';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { beginCell, Cell, safeSign, StateInit } from 'ton';
import { WalletKeys } from '../../../storage/walletKeys';
import { fragment } from '../../../fragment';
import { warn } from '../../../utils/log';
import { useEngine } from '../../../engine/Engine';
import { ConnectEvent, ConnectItemReply, ConnectRequest, SessionCrypto } from '@tonconnect/protocol';
import { ConnectReplyBuilder } from '../../../engine/tonconnect/ConnectReplyBuilder';
import { ConnectQrQuery, TonConnectBridgeType } from '../../../engine/tonconnect/types';
import { tonConnectDeviceInfo } from '../../../engine/tonconnect/config';
import { useParams } from '../../../utils/useParams';
import { connectAnswer } from '../../../engine/api/connectAnswer';
import { sendTonConnectResponse } from '../../../engine/api/sendTonConnectResponse';
import { checkProtocolVersionCapability, verifyConnectRequest } from '../../../engine/tonconnect/utils';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DappAuthComponent, TonConnectSignState } from './DappAuthComponent';

const SignStateLoader = React.memo(({ connectProps }: { connectProps: TonConnectAuthProps }) => {
    const { AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const [state, setState] = useState<TonConnectSignState>({ type: 'loading' });
    const engine = useEngine();

    useEffect(() => {
        (async () => {
            if (connectProps.type === 'qr') {
                try {
                    const handled = await engine.products.tonConnect.handleConnectDeeplink(connectProps.query);

                    if (handled) {
                        checkProtocolVersionCapability(handled.protocolVersion);
                        verifyConnectRequest(handled.request);

                        if (handled.manifest) {
                            setState({
                                type: 'initing',
                                name: handled.manifest.name,
                                url: handled.manifest.url,
                                app: handled.manifest,
                                protocolVersion: handled.protocolVersion,
                                request: handled.request,
                                clientSessionId: handled.clientSessionId,
                                returnStrategy: handled.returnStrategy
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

            const manifest = await engine.products.tonConnect.getConnectAppManifest(connectProps.request.manifestUrl);

            if (manifest) {
                setState({
                    type: 'initing',
                    name: manifest.name,
                    url: manifest.url,
                    app: manifest,
                    protocolVersion: connectProps.protocolVersion,
                    request: connectProps.request
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

    const approve = React.useCallback(async () => {

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
            let walletConfig = contract.source.backup();
            let walletType = contract.source.type;
            let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
            let appInstanceKeyPair = await getAppInstanceKeyPair();

            // Sign
            let walletKeys: WalletKeys;
            try {
                walletKeys = await authContext.authenticate({ cancelable: true });
            } catch (e) {
                warn('Failed to load wallet keys');
                return;
            }

            const stateInit = new StateInit({ code: contract.source.initialCode, data: contract.source.initialData });
            const stateInitCell = new Cell();
            stateInit.writeTo(stateInitCell);
            const stateInitStr = stateInitCell.toBoc({ idx: false }).toString('base64');
            const replyBuilder = new ConnectReplyBuilder(state.request, state.app);

            let replyItems: ConnectItemReply[];
            try {
                replyItems = replyBuilder.createReplyItems(
                    acc.address.toFriendly({ testOnly: AppConfig.isTestnet, urlSafe: true, bounceable: true }),
                    Uint8Array.from(walletKeys.keyPair.secretKey),
                    stateInitStr,
                    AppConfig.isTestnet
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
                    .storeRefMaybe(beginCell()
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
                    testnet: AppConfig.isTestnet
                });

                // Send connect response
                sendTonConnectResponse({ response, sessionCrypto, clientSessionId: state.clientSessionId });

                // Save connection
                engine.products.tonConnect.saveAppConnection(
                    {
                        name: state.app.name,
                        url: state.app.url,
                        iconUrl: state.app.iconUrl,
                        autoConnectDisabled: false
                    },
                    {
                        type: TonConnectBridgeType.Remote,
                        sessionKeyPair: sessionCrypto.stringifyKeypair(),
                        clientSessionId: state.clientSessionId,
                        replyItems,
                    },
                );

                setState({ type: 'authorized', returnStrategy: state.returnStrategy });
                navigation.goBack();
                return;
            } else if (connectProps.type === 'callback') {
                connectProps.callback({ ok: true, replyItems });
                setTimeout(() => {
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

    }, [state]);

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
    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <SignStateLoader connectProps={props} />
        </>
    );
});