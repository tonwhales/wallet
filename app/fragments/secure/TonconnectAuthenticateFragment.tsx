import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform, StyleProp, Text, TextStyle, View, Image } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { t, tStyled } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backoff } from '../../utils/time';
import axios from 'axios';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { addConnectionReference, addPendingGrant, getAppInstanceKeyPair, getCurrentAddress, removePendingGrant } from '../../storage/appState';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { AppConfig } from '../../AppConfig';
import { beginCell, Cell, safeSign } from 'ton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { Theme } from '../../Theme';
import { fragment } from '../../fragment';
import { warn } from '../../utils/log';
import SuccessIcon from '../../../assets/ic_success.svg';
import ChainIcon from '../../../assets/ic_chain.svg';
import ProtectedIcon from '../../../assets/ic_protected.svg';
import { CloseButton } from '../../components/CloseButton';
import { AppData } from '../../engine/api/fetchAppData';
import { Engine, useEngine } from '../../engine/Engine';
import { WImage } from '../../components/WImage';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { CheckBox } from '../../components/CheckBox';
import { extractDomain } from '../../engine/utils/extractDomain';
import { getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto';
import Url from 'url-parse';
import isValid from 'is-valid-domain';
import { IConnectQrQuery, TonConnect } from '../../engine/tonconnect/TonConnect';
import { ConnectRequest, SessionCrypto } from '@tonconnect/protocol';
import { AppManifest, fetchManifest } from '../../engine/tonconnect/fetchManifest';
import { ConnectReplyBuilder } from '../../engine/tonconnect/ConnectReplyBuilder';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

type SignState = { type: 'loading' }
    | { type: 'expired' }
    | {
        type: 'initing',
        name: string,
        url: string,
        app: AppManifest,
        protocolVersion: number,
        request: ConnectRequest,
    }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }


async function handleConnectDeeplink(query: IConnectQrQuery, engine: Engine) {
    try {
        const protocolVersion = Number(query.v);
        const request = JSON.parse(decodeURIComponent(query.r)) as ConnectRequest;
        const clientSessionId = query.id;

        TonConnect.checkProtocolVersionCapability(protocolVersion);
        TonConnect.verifyConnectRequest(request);

        const manifest = await engine.products.extensions.getConnectAppData(request.manifestUrl);

        return ({
            protocolVersion,
            request,
            clientSessionId,
            manifest
        })
    } catch (err) {
        console.log('handleConnectDeeplink error', err);
    }
}

const SignStateLoader = React.memo((props: { query: IConnectQrQuery }) => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<SignState>({ type: 'loading' });
    const engine = useEngine();
    React.useEffect(() => {
        (async () => {
            try {
                const handled = await handleConnectDeeplink(props.query, engine);

                if (handled) {
                    TonConnect.checkProtocolVersionCapability(handled.protocolVersion);
                    TonConnect.verifyConnectRequest(handled.request);

                    if (handled.manifest) {
                        setState({
                            type: 'initing',
                            name: handled.manifest.name,
                            url: handled.manifest.url,
                            app: handled.manifest,
                            protocolVersion: handled.protocolVersion,
                            request: handled.request,
                        });
                        return;
                    }
                    setState({ type: 'failed' });
                    return;
                }

            } catch (error) {
                setState({ type: 'failed' });
            }
        })()
    }, []);

    // Approve
    const acc = React.useMemo(() => getCurrentAddress(), []);
    let active = React.useRef(true);
    React.useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = React.useCallback(async () => {

        if (state.type !== 'initing') {
            return;
        }

        const sessionCrypto = new SessionCrypto();

        if (state.protocolVersion === 1) {
            setState({ type: 'failed' });
        }

        try {
            // Load data
            const contract = contractFromPublicKey(acc.publicKey);
            let walletConfig = contract.source.backup();
            let walletType = contract.source.type;
            let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
            let appInstanceKeyPair = await getAppInstanceKeyPair();
            let endpoint = 'https://connect.tonhubapi.com/connect/command';
            let name = state.name;
            let url = state.url;
            let title = state.app ? state.app.name : name;
            let image = state.app?.iconUrl

            // Sign
            let walletKeys: WalletKeys;
            try {
                walletKeys = await loadWalletKeys(acc.secretKeyEnc);
            } catch (e) {
                warn(e);
                return;
            }

            const { stateInit } = await vault.tonWallet.createStateInit();
            const walletStateInit = TonWeb.utils.bytesToBase64(await stateInit.toBoc(false));

            const replyBuilder = new ConnectReplyBuilder(state.request, state.app)

            const replyItems = replyBuilder.createReplyItems(
                address,
                Uint8Array.from(walletKeys.keyPair.secretKey),
                walletStateInit,
            );

            requestPromise.resolve({ address, replyItems });

            if (props.protocolVersion === 1 && props.request.return_url) {
                animation.showReturnButton();
                return;
            }


        } catch (error) {
            setState({ type: 'failed' });
        }

        // const sendToCallbackUrl = React.useCallback(
        //     async (response: string) => {
        //       if (props.protocolVersion !== 1) {
        //         return;
        //       }

        //       const { request } = props;

        //       if (request.callback_url) {
        //         const callbackUrl = createCallbackLink({
        //           toHash: request.return_serverless,
        //           url: request.callback_url,
        //           response,
        //         });

        //         const resp = await axios.get(callbackUrl);
        //         if (resp.status !== 200) {
        //           throw new Error('Failed to send response');
        //         }
        //       }
        //     },
        //     [props],
        //   );

        // saveAppConnection(
        //     address,
        //     {
        //       name: manifest.name,
        //       url: manifest.url,
        //       icon: manifest.iconUrl,
        //     },
        //     webViewUrl
        //       ? { type: TonConnectBridgeType.Injected, replyItems }
        //       : {
        //         type: TonConnectBridgeType.Remote,
        //         sessionKeyPair: sessionCrypto!.stringifyKeypair(),
        //         clientSessionId: clientSessionId!,
        //         replyItems,
        //       },
        //   );

        await TonConnect.send(response, sessionCrypto, clientSessionId);

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
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.expired')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    // Failed
    if (state.type === 'failed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.failed')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    // Completed
    if (state.type === 'completed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.completed')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
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
                        color: Theme.textColor,
                    }}
                >
                    {t('auth.authorized')}
                </Text>
                <Text style={{
                    color: Theme.textSecondary,
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
                    onPress={() => navigation.goBack()}
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
                        backgroundColor: Theme.divider,
                        position: 'absolute',
                        left: 88, right: 88,
                        height: 1, top: 32
                    }} />
                    <View style={{
                        alignSelf: 'center',
                        backgroundColor: Theme.accent,
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
                            color: Theme.textColor,
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
                            color: Theme.textSecondary
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {
                            (state.type === 'initing' && state.app
                                ? new URL(state.app.url).host
                                : new URL(state.url).host
                            )
                        }
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
                        backgroundColor: 'white'
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
                            backgroundColor: 'transparent',
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            opacity: 0.06
                        }} />
                    </View>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '700',
                            color: Theme.textColor,
                            marginBottom: 4
                        }}
                    >
                        {t('auth.yourWallet')}
                    </Text>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: '400',
                        color: Theme.textSecondary,
                    }}>
                        <Text>
                            {
                                acc.address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(0, 4)
                                + '...'
                                + acc.address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(t.length - 6)
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
                    color: Theme.textColor,
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
                        color: Theme.textColor,
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

export const TonconnectAuthenticateFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { query }: { query: IConnectQrQuery } = useRoute().params as any;
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
            <SignStateLoader query={query} />
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