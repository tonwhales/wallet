import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useDimensions } from "@react-native-community/hooks";
import { mnemonicNew } from "ton-crypto";

import IcCheck from "../../../assets/ic-check.svg";

export const LegalFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const dimensions = useDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const isCreate = route.name === 'LegalCreate';

    const [state, setState] = useState<{ mnemonics: string } | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isCreate) {
            return;
        }
        (async () => {
            const mnemonics = await mnemonicNew();
            setState({ mnemonics: mnemonics.join(' ') });
        })()
    }, []);

    const onContinue = useCallback(() => {
        if (isCreate) {
            setLoading(true);
            if (state) {
                navigation.replace('WalletCreate', { mnemonics: state.mnemonics });
                return;
            }
            setReady(true);
            return;
        }
        navigation.replace('WalletImport');
    }, [state]);

    useEffect(() => {
        if (ready) {
            if (state) {
                navigation.replace('WalletCreate', { mnemonics: state.mnemonics });
                return;
            }
        }
    }, [accepted, state]);

    return (
        <View style={{
            flex: 1,
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: Theme.white,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
            paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 16 : safeArea.bottom) + 42 : 0,
        }}>
            <AndroidToolbar />
            <ScrollView style={{ flexGrow: 1, width: '100%' }}>
                {!isCreate && (
                    <>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                            <Text style={{
                                fontSize: 32, lineHeight: 38,
                                fontWeight: '600',
                                textAlign: 'center',
                                color: Theme.textColor,
                                marginBottom: 12, marginTop: 16
                            }}>
                                {t('legal.title')}
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
                    </>
                )}
                <View style={{ flexGrow: 1 }} />
            </ScrollView>
            <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 }}
                onPress={() => setAccepted(!accepted)}
            >
                <View style={{
                    height: 24, width: 24,
                    backgroundColor: accepted ? Theme.accent : '#E4E6EA',
                    borderRadius: 6,
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 16
                }}>
                    {accepted && (<IcCheck color={Theme.white} />)}
                </View>
                <Text
                    style={{
                        flexShrink: 1,
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '500',
                        textAlign: 'left'
                    }}
                >
                    <Text style={{
                        color: Theme.textSubtitle,
                    }}>
                        {t('legal.subtitle')}
                    </Text>
                    <Text
                        style={{ color: Theme.accent }}
                        onPress={() => navigation.navigate('Privacy')}>
                        {t('legal.privacyPolicy')}
                    </Text>
                    <Text style={{ color: Theme.textSubtitle, }}>
                        {' ' + t('common.and') + ' '}
                    </Text>
                    <Text style={{ color: Theme.accent }}
                        onPress={() => navigation.navigate('Terms')}>
                        {t('legal.termsOfService')}
                    </Text>
                </Text>
            </Pressable>
            <View style={{
                padding: 16,
                width: '100%'
            }}>
                <RoundButton
                    disabled={!accepted}
                    loading={loading}
                    title={t('common.continue')}
                    onPress={onContinue}
                />
            </View>
        </View>
    );
});