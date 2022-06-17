import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform, StyleProp, Text, TextStyle, View, Image } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { t, tStyled } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { getAppInstanceKeyPair, getCurrentAddress } from '../../storage/appState';
import { AppConfig } from '../../AppConfig';
import { Theme } from '../../Theme';
import { fragment } from '../../fragment';
import ChainIcon from '../../../assets/ic_chain.svg';
import ProtectedIcon from '../../../assets/ic_protected.svg';
import { CloseButton } from '../../components/CloseButton';
import { useEngine } from '../../engine/Engine';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import { getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { beginCell, safeSign } from 'ton';
import { extractDomain } from '../../engine/utils/extractDomain';
import { WImage } from '../../components/WImage';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

const SignStateLoader = React.memo((props: { url: string }) => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();

    // App Data
    let appData = engine.products.extensions.useAppData(props.url);

    // Approve
    const acc = React.useMemo(() => getCurrentAddress(), []);
    let active = React.useRef(true);
    React.useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = React.useCallback(async () => {

        // Load data
        const contract = contractFromPublicKey(acc.publicKey);
        let appInstanceKeyPair = await getAppInstanceKeyPair();
        let domain = extractDomain(props.url);
        let time = Math.floor(Date.now() / 1000);

        // Create signing key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            warn(e);
            return;
        }
        let secret = await getSecureRandomBytes(32);
        let subkey = keyPairFromSeed(secret);
        let toSign = beginCell()
            .storeCoins(1)
            .storeBuffer(subkey.publicKey)
            .storeUint(time, 32)
            .storeAddress(contract.address)
            .storeRef(beginCell().storeBuffer(Buffer.from(domain)).endCell())
            .storeRef(beginCell().storeBuffer(appInstanceKeyPair.publicKey).endCell())
            .endCell();
        let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

        // Persist key
        engine.persistence.domainKeys.setValue(domain, { time, signature, secret });

        // Add extension
        engine.products.extensions.addExtension(props.url);

        // Navigate
        navigation.goBack();
        navigation.navigate('App', { url: props.url });
    }, []);

    // When loading
    if (!appData) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <LoadingIndicator simple={true} />
            </View>
        )
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
                        src={appData.image?.preview256}
                        blurhash={appData.image?.blurhash}
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
                        {appData.title}
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
                        {extractDomain(props.url)}
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
                {tStyled('install.message', { name: appData.title })}
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
                    title={t('install.action')}
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

export const InstallFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params: { url: string } = useRoute().params as any;
    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('install.title')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('install.title')}</Text>
                </View>
            )}
            <SignStateLoader url={params.url} />
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