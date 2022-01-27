import { useRoute } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';

export const LegalFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const { height } = useWindowDimensions();
    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? safeArea.top : 0 }}>
            <AndroidToolbar style={{ marginTop: 16 }} pageTitle={t('Legal')} />
            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 116 }}>
                <LottieView
                    source={require('../../../assets/animations/paper.json')}
                    autoPlay={true}
                    loop={true}
                    style={{ width: height * 0.15, height: height * 0.15, marginBottom: 8 }}
                />
                <Text style={{ fontSize: 30, fontWeight: '700', height: 34, textAlign: 'center' }}>
                    {t('Legal')}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    color: '#8E979D',
                    fontSize: 14,
                    marginTop: 14,
                    marginHorizontal: 35
                }}>
                    {t('Please review the Tonhub Wallet ')}
                    <Text style={{ color: '#1C8FE3' }} onPress={() => navigation.navigate('Privacy')}>{t('Privacy policy')}</Text>
                    {t(' and ')}
                    <Text style={{ color: '#1C8FE3' }} onPress={() => navigation.navigate('Terms')}>{t('Terms of Service')}</Text>
                </Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Accept")} onPress={() => route.name === 'LegalCreate' ? navigation.replace('WalletCreate') : navigation.replace('WalletImport')} />
            </View>
        </View>
    );
});