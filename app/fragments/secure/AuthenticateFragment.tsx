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
import { useEngine } from '../../engine/Engine';
import { WImage } from '../../components/WImage';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { CheckBox } from '../../components/CheckBox';
import { extractDomain } from '../../engine/utils/extractDomain';
import Url from 'url-parse';
import isValid from 'is-valid-domain';
import { connectAnswer } from '../../engine/api/connectAnswer';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

type SignState = { type: 'loading' }
    | { type: 'expired' }
    | { type: 'initing', name: string, url: string, app?: AppData | null }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }

const SignStateLoader = React.memo((props: { session: string, endpoint: string }) => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<SignState>({ type: 'loading' });
    const [addExtension, setAddExtension] = React.useState(false);
    const engine = useEngine();
    React.useEffect(() => {
        let ended = false;
        backoff('authenticate', async () => {
            if (ended) {
                return;
            }
            let currentState = await axios.get('https://' + props.endpoint + '/connect/' + props.session);
            if (ended) {
                return;
            }
            if (currentState.data.state === 'not_found') {
                setState({ type: 'expired' });
                return;
            }
            if (currentState.data.state === 'initing') {
                const appData = await engine.products.extensions.getAppData(currentState.data.url);
                if (appData) {
                    setState({ type: 'initing', name: currentState.data.name, url: currentState.data.url, app: appData });
                    return;
                }
                setState({ type: 'failed' });
                return;
            }
            if (currentState.data.state === 'ready') {
                setState({ type: 'completed' });
                return;
            }
            setState({ type: 'expired' });
        });
        return () => {
            ended = true;
        };
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

        // Load data
        const contract = contractFromPublicKey(acc.publicKey);
        let walletConfig = contract.source.backup();
        let walletType = contract.source.type;
        let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
        let appInstanceKeyPair = await getAppInstanceKeyPair();
        let endpoint = 'https://connect.tonhubapi.com/connect/command';
        let name = state.name;
        let url = state.url;
        let title = state.app ? state.app.title : name;
        let image = state.app?.image ? {
            blurhash: state.app.image.blurhash,
            url: state.app.image.preview256
        } : null;

        // Sign
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            warn('Failed to load wallet keys');
            return;
        }
        let toSign = beginCell()
            .storeCoins(0)
            .storeBuffer(Buffer.from(props.session, 'base64'))
            .storeAddress(contract.address)
            .storeRefMaybe(beginCell()
                .storeBuffer(Buffer.from(endpoint))
                .endCell())
            .storeRef(beginCell()
                .storeBuffer(appInstanceKeyPair.publicKey)
                .endCell())
            .endCell();
        let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

        // Notify
        await backoff('authenticate', async () => {
            if (!active.current) {
                return;
            }

            // Apply answer
            await connectAnswer({
                reportEndpoint: props.endpoint,
                key: props.session,
                appPublicKey: appInstanceKeyPair.publicKey.toString('base64'),
                address: address,
                walletType,
                walletConfig,
                walletSig: signature.toString('base64'),
                endpoint,
                kind: 'ton-x',
                testnet: AppConfig.isTestnet
            });

            // Persist reference
            addConnectionReference(props.session, name, url, Date.now());
            addPendingGrant(props.session);

            // Grant access
            await backoff('authenticate', async () => {
                await axios.post('https://connect.tonhubapi.com/connect/grant', { key: props.session }, { timeout: 5000 });
                removePendingGrant(props.session);
            });

            // Track
            trackEvent(MixpanelEvent.Connect, { url, name });

            // Exit if already exited screen
            if (!active.current) {
                return;
            }

            setState({ type: 'authorized' });
        });

        // Add extension if AppData has extension field
        // and option is checked
        if (addExtension && state.app?.extension) {
            // Read cell from extension field
            let slice = Cell.fromBoc(Buffer.from(state.app?.extension, 'base64'))[0].beginParse();
            let endpoint = slice.readRef().readRemainingBytes().toString();
            let extras = slice.readBit();
            let customTitle: string | null = null;
            let customImage: { url: string, blurhash: string } | null = null;
            if (!extras) {
                if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                    warn('Invalid endpoint');
                    return;
                }
            } else {
                // Read custom title
                if (slice.readBit()) {
                    customTitle = slice.readRef().readRemainingBytes().toString()
                    if (customTitle.trim().length === 0) {
                        customTitle = null;
                    }
                }
                // Read custom image
                if (slice.readBit()) {
                    let imageUrl = slice.readRef().readRemainingBytes().toString();
                    let imageBlurhash = slice.readRef().readRemainingBytes().toString();
                    new Url(imageUrl, true);
                    customImage = { url: imageUrl, blurhash: imageBlurhash };
                }

                // Future compatibility
                extras = slice.readBit();
                if (!extras) {
                    if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                        warn('Invalid endpoint');
                        return;
                    }
                }
            }

            // Validate endpoint
            let parsedEndpoint = new Url(endpoint, true);
            if (parsedEndpoint.protocol !== 'https:') {
                warn('Invalid endpoint');
                return;
            }
            if (!isValid(parsedEndpoint.hostname)) {
                warn('Invalid endpoint');
                return;
            }


            // Create domain key if needed
            let domain = extractDomain(endpoint);
            await engine.products.keys.createDomainKeyIfNeeded(domain, walletKeys); // Always succeeds

            // Add extension
            engine.products.extensions.addExtension(
                endpoint,
                customTitle ? customTitle : title,
                customImage ? customImage : image
            );

            // Track installation
            trackEvent(MixpanelEvent.AppInstall, { url: endpoint, domain: domain });

            // Navigate
            navigation.goBack();
            navigation.navigate('App', { url });
        }
    }, [state, addExtension]);

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
                        src={state.app?.image?.preview256}
                        blurhash={state.app?.image?.blurhash}
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
                        {state.type === 'initing' && state.app ? state.app.title : state.name}
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
                {tStyled('auth.message', { name: state.app ? state.app.title : state.name })}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: 32 }}>
                <ProtectedIcon height={26} width={26} style={{ marginRight: 10 }} />
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: Theme.textColor,
                        marginBottom: state.app?.extension ? 16 : 32,
                        opacity: 0.6
                    }}
                >{
                        t('auth.hint')}
                </Text>
            </View>
            {!!state.app?.extension && (
                <CheckBox
                    checked={addExtension}
                    onToggle={setAddExtension}
                    text={t('auth.apps.installExtension')}
                    style={{
                        paddingHorizontal: 24,
                        marginBottom: 32,
                        width: '100%'
                    }}
                />
            )}
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

export const AuthenticateFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params: {
        session: string,
        endpoint: string | null
    } = useRoute().params as any;
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
            <SignStateLoader session={params.session} endpoint={params.endpoint || 'connect.tonhubapi.com'} />
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