import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform, StyleProp, Text, TextStyle, View, Image } from "react-native";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { t, tStyled } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { getCurrentAddress } from '../../storage/appState';
import { fragment } from '../../fragment';
import ChainIcon from '../../../assets/ic_chain.svg';
import ProtectedIcon from '../../../assets/ic_protected.svg';
import { CloseButton } from '../../components/CloseButton';
import { extractDomain } from '../../engine/utils/extractDomain';
import { WImage } from '../../components/WImage';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useAppData } from '../../engine/hooks/dapps/useAppData';
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAddExtension } from '../../engine/effects/dapps/useAddExtension';
import { useCreateDomainKeyIfNeeded } from '../../engine/effects/dapps/useCreateDomainKeyIfNeeded';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

const SignStateLoader = memo((props: { url: string, title: string | null, image: { url: string, blurhash: string } | null }) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const addExtension = useAddExtension();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();

    // App Data
    let appData = useAppData(props.url);

    // Approve
    const acc = useMemo(() => getCurrentAddress(), []);
    let active = useRef(true);
    let success = useRef(false);
    useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = useCallback(async () => {

        // Create Domain Key if Needed
        let domain = extractDomain(props.url);
        let created = await createDomainKeyIfNeeded(domain, authContext);
        if (!created) {
            return;
        }

        // Add extension
        addExtension(props.url, props.title, props.image);

        // Track installation
        success.current = true;
        trackEvent(MixpanelEvent.AppInstall, { url: props.url, domain: domain }, isTestnet);

        // Navigate
        navigation.replace('App', { url: props.url });
    }, []);
    useEffect(() => {
        if (!success.current) {
            let domain = extractDomain(props.url);
            trackEvent(MixpanelEvent.AppInstallCancel, { url: props.url, domain: domain }, isTestnet);
        }
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
                        src={props.image ? props.image.url : appData.image?.preview256}
                        blurhash={props.image ? props.image.blurhash : appData.image?.blurhash}
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
                        {props.title ? props.title : appData.title}
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
                {tStyled('install.message', { name: props.title ? props.title : appData.title })}
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
    const params: { url: string, title: string | null, image: { url: string, blurhash: string } | null } = useRoute().params as any;
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
            <SignStateLoader url={params.url} image={params.image} title={params.title} />
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