import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, Text, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { markAsTermsAccepted } from "../../storage/appState";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useDimensions } from "@react-native-community/hooks";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { mnemonicNew } from "ton-crypto";

export const LegalFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const dimensions = useDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const isCreate = route.name === 'LegalCreate';

    const [state, setState] = useState<{ mnemonics: string } | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const mnemonics = await mnemonicNew();
            setState({ mnemonics: mnemonics.join(' ') });
        })()
    }, []);

    const onAccept = useCallback(() => {
        if (isCreate) {
            if (state) {
                navigation.replace('WalletCreate', { mnemonics: state.mnemonics });
                return;
            }
            setAccepted(true);
            return;
        }
        navigation.replace('WalletImport');
    }, [state]);

    useEffect(() => {
        if (accepted) {
            if (state) {
                navigation.replace('WalletCreate', { mnemonics: state.mnemonics });
                return;
            }
            setLoading(true);
        }
    }, [accepted, state]);

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: 'white',
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
            paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 32 : safeArea.bottom) + 16 : 0,
        }}>
            <AndroidToolbar pageTitle={t('legal.title')} />
            {!isCreate && (
                <>
                    <View style={{ flexGrow: 1 }} />
                    <FragmentMediaContent
                        animation={require('../../../assets/animations/paper.json')}
                        title={t('legal.title')}
                    >
                        <Text style={{ color: 'black', marginTop: 16 }}>
                            <Text style={{
                                textAlign: 'center',
                                color: Theme.textSubtitle,
                                fontSize: 14,
                            }}>
                                {t('legal.subtitle') + '\n'}
                            </Text>
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 14,
                                    color: Theme.accent
                                }}
                                onPress={() => navigation.navigate('Privacy')}>
                                {t('legal.privacyPolicy')}
                            </Text>
                            <Text style={{
                                textAlign: 'center',
                                color: Theme.textSubtitle,
                                fontSize: 14,
                            }}>
                                {' ' + t('common.and') + ' '}
                            </Text>
                            <Text style={{
                                textAlign: 'center',
                                fontSize: 14,
                                color: Theme.accent
                            }}
                                onPress={() => navigation.navigate('Terms')}>
                                {t('legal.termsOfService')}
                            </Text>
                        </Text>
                    </FragmentMediaContent>
                </>
            )}
            {isCreate && (
                <>
                    <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: Theme.textColor,
                            marginBottom: 12, marginTop: 16
                        }}>
                            {t('legal.create')}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: Theme.darkGrey,
                            marginBottom: 32
                        }}>
                            {t('legal.createSubtitle')}
                        </Text>
                    </View>
                    <View style={{
                        width: dimensions.screen.width, height: 300,
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <LottieView
                            source={require('../../../assets/animations/paper.json')}
                            autoPlay={true}
                            loop={true}
                            style={{ width: dimensions.screen.width, height: 300, marginBottom: 8, maxWidth: 140, maxHeight: 140 }}
                        />
                    </View>
                    <Text style={{ color: 'black', paddingHorizontal: 34 }}>
                        <Text style={{
                            textAlign: 'center',
                            color: Theme.textSubtitle,
                            fontSize: 14,
                        }}>
                            {t('legal.subtitle') + '\n'}
                        </Text>
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 14,
                                color: Theme.accent
                            }}
                            onPress={() => navigation.navigate('Privacy')}>
                            {t('legal.privacyPolicy')}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            color: Theme.textSubtitle,
                            fontSize: 14,
                        }}>
                            {' ' + t('common.and') + ' '}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 14,
                            color: Theme.accent
                        }}
                            onPress={() => navigation.navigate('Terms')}>
                            {t('legal.termsOfService')}
                        </Text>
                    </Text>
                </>
            )}
            <View style={{ flexGrow: 1 }} />
            <View style={{
                padding: 16,
                marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom,
                alignSelf: 'stretch'
            }}>
                <RoundButton loading={loading} title={t('common.continue')} onPress={onAccept} />
            </View>
        </View >
    );
});