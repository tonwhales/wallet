import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Image, Linking } from "react-native";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { t, tStyled } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { getAppInstanceKeyPair, getCurrentAddress } from '../../storage/appState';
import { contractFromPublicKey, walletConfigFromContract, walletContactType } from '../../engine/contractFromPublicKey';
import { beginCell, Cell, safeSign, StateInit, storeStateInit } from '@ton/core';
import { WalletKeys } from '../../storage/walletKeys';
import { fragment } from '../../fragment';
import { warn } from '../../utils/log';
import SuccessIcon from '../../../assets/ic_success.svg';
import ChainIcon from '../../../assets/ic_chain.svg';
import ProtectedIcon from '../../../assets/ic_protected.svg';
import { CloseButton } from '../../components/CloseButton';
import { WImage } from '../../components/WImage';
import { ConnectEvent, ConnectItemReply, ConnectRequest, SessionCrypto } from '@tonconnect/protocol';
import { AppManifest } from '../../engine/api/fetchManifest';
import { useParams } from '../../utils/useParams';
import { connectAnswer } from '../../engine/api/connectAnswer';
import { sendTonConnectResponse } from '../../engine/api/sendTonConnectResponse';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { ConnectQrQuery, ReturnStrategy } from '../../engine/legacy/tonconnect/types';
import { checkProtocolVersionCapability, verifyConnectRequest } from '../../engine/legacy/tonconnect/utils';
import { ConnectReplyBuilder } from '../../engine/legacy/tonconnect/ConnectReplyBuilder';
import { tonConnectDeviceInfo } from '../../engine/legacy/tonconnect/config';
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { handleConnectDeeplink } from '../../engine/effects/dapps/handleConnectDeeplink';
import { isUrl } from '../../utils/resolveUrl';
import { extractDomain } from '../../engine/utils/extractDomain';
import { getAppManifest } from '../../engine/getters/getAppManifest';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigStore } from '../../utils/ConfigStore';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

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
        domain: string
    }
    | { type: 'completed', returnStrategy?: ReturnStrategy }
    | { type: 'authorized', returnStrategy?: ReturnStrategy }
    | { type: 'failed', returnStrategy?: ReturnStrategy }

const SignStateLoader = memo(({ connectProps }: { connectProps: TonConnectAuthProps }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = useState<SignState>({ type: 'loading' });
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
                                domain: domain
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
                    domain: domain
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
                walletKeys = await authContext.authenticate({ cancelable: true });
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

                // Send connect response
                sendTonConnectResponse({ response, sessionCrypto, clientSessionId: state.clientSessionId });

                // Save connection
                // TODO: save connection
                // engine.products.tonConnect.saveAppConnection(
                //     {
                //         name: state.app.name,
                //         url: state.app.url,
                //         iconUrl: state.app.iconUrl,
                //         autoConnectDisabled: false
                //     },
                //     {
                //         type: TonConnectBridgeType.Remote,
                //         sessionKeyPair: sessionCrypto.stringifyKeypair(),
                //         clientSessionId: state.clientSessionId,
                //         replyItems,
                //     },
                // );

                setState({ type: 'authorized', returnStrategy: state.returnStrategy });
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

    // When loading
    if (state.type === 'loading') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <LoadingIndicator simple={true} />
            </View>
        )
    }

    // Expired
    if (state.type === 'expired') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 32 }}>{t('auth.expired')}</Text>
                <RoundButton
                    title={t('common.back')}
                    onPress={() => {
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
                    }}
                    size="large"
                    style={{ width: 200 }}
                    display="outline"
                />
            </View>
        );
    }

    // Failed
    if (state.type === 'failed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 32 }}>{t('auth.failed')}</Text>
                <RoundButton
                    title={t('common.back')}
                    onPress={() => {
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
                    }}
                    size="large"
                    style={{ width: 200 }}
                    display="outline"
                />
            </View>
        );
    }

    // Completed
    if (state.type === 'completed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 32 }}>{t('auth.completed')}</Text>
                <RoundButton
                    title={t('common.back')}
                    onPress={() => {
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
                    }}
                    size="large"
                    style={{ width: 200 }}
                    display="outline"
                />
            </View>
        );
    }

    // Authorised
    if (state.type === 'authorized') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <SuccessIcon
                    style={{
                        marginBottom: 24
                    }}
                    height={56}
                    width={56}
                />
                <Text
                    style={{
                        fontSize: 24,
                        marginHorizontal: 32,
                        textAlign: 'center',
                        color: theme.textColor,
                    }}
                >
                    {t('auth.authorized')}
                </Text>
                <Text style={{
                    color: theme.textSecondary,
                    fontWeight: '400',
                    fontSize: 16,
                    marginTop: 10,
                    marginBottom: 32,
                    textAlign: 'center',
                    marginHorizontal: 32
                }}>
                    {t('auth.authorizedDescription')}
                </Text>
                <RoundButton
                    title={t('common.close')}
                    onPress={() => {
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
                    }}
                    size="large"
                    style={{ width: 200 }}
                    display="outline"
                />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexGrow: 1 }} />
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    width: '100%',
                    justifyContent: 'center',
                }}
            >
                <View style={{
                    position: 'absolute',
                    height: 64,
                    top: 0, left: 0, right: 0,
                    justifyContent: 'center',
                }}>
                    <View style={{
                        backgroundColor: theme.divider,
                        position: 'absolute',
                        left: 88, right: 88,
                        height: 1, top: 32
                    }} />
                    <View style={{
                        alignSelf: 'center',
                        backgroundColor: theme.accent,
                        height: 30, width: 30,
                        borderRadius: 15
                    }}>
                        <ChainIcon style={{ height: 24, width: 24 }} />
                    </View>
                </View>
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 154,
                }}>
                    <WImage
                        heigh={64}
                        width={64}
                        style={{ marginBottom: 8 }}
                        src={state.app?.iconUrl}
                        borderRadius={16}
                    />
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '700',
                            color: theme.textColor,
                            marginBottom: 4
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {state.type === 'initing' && state.app ? state.app.name : state.name}
                    </Text>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '400',
                            color: theme.textSecondary
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {state.domain}
                    </Text>
                </View>
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 154,
                }}>
                    <View style={{
                        width: 64, height: 64,
                        borderRadius: 16,
                        overflow: 'hidden',
                        marginBottom: 8,
                        backgroundColor: theme.item
                    }}>
                        <Image
                            source={require('../../../assets/ic_app_tonhub.png')}
                            style={{ width: 64, height: 64 }}
                            resizeMode={'cover'}
                        />
                        <View style={{
                            borderRadius: 10,
                            borderWidth: 0.5,
                            borderColor: 'black',
                            backgroundColor: theme.transparent,
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            opacity: 0.06
                        }} />
                    </View>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '700',
                            color: theme.textColor,
                            marginBottom: 4
                        }}
                    >
                        {t('auth.yourWallet')}
                    </Text>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: '400',
                        color: theme.textSecondary,
                    }}>
                        <Text>
                            {
                                acc.address.toString({ testOnly: isTestnet }).slice(0, 4)
                                + '...'
                                + acc.address.toString({ testOnly: isTestnet }).slice(t.length - 6)
                            }
                        </Text>
                    </Text>
                </View>
            </View>
            <Text
                style={{
                    fontSize: 24,
                    marginHorizontal: 32,
                    textAlign: 'center',
                    color: theme.textColor,
                    marginBottom: 32,
                    fontWeight: '600',
                    marginTop: 24
                }}
            >
                {tStyled('auth.message', { name: state.app ? state.app.name : state.name })}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: 32 }}>
                <ProtectedIcon height={26} width={26} style={{ marginRight: 10 }} />
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: theme.textColor,
                        marginBottom: 32,
                        opacity: 0.6
                    }}
                >{
                        t('auth.hint')}
                </Text>
            </View>
            <View style={{
                height: 64,
                marginBottom: safeArea.bottom + 16,
                marginHorizontal: 16,
                flexDirection: 'row',
                justifyContent: 'space-evenly'
            }}>
                <RoundButton
                    title={t('common.cancel')}
                    display={'secondary'}
                    onPress={() => navigation.goBack()}
                    style={{
                        flexGrow: 1,
                        marginRight: 7,
                        height: 56
                    }}
                />
                <RoundButton
                    title={t('auth.action')}
                    action={approve}
                    style={{
                        marginLeft: 7,
                        height: 56,
                        flexGrow: 1,
                    }}
                />
            </View>
        </View>
    );
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
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const props = useParams<TonConnectAuthProps>();

    React.useEffect(() => {
        return () => {
            if (props && props.type === 'callback' && props.callback) {
                props.callback({ ok: false });
            }
        }
    }, []);
    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('auth.title')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('auth.title')}</Text>
                </View>
            )}
            <SignStateLoader connectProps={props} />
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </>
    );
});