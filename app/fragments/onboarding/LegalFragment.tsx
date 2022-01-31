import { useRoute } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";

export const LegalFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? safeArea.top : 0 }}>
            <AndroidToolbar pageTitle={t('Legal')} />
            <FragmentMediaContent
                animation={require('../../../assets/animations/paper.json')}
                title={t('Legal')}
            >
                <Text style={{
                    textAlign: 'center',
                    color: '#8E979D',
                    fontSize: 14,
                    marginTop: 14,
                }}>
                    <Text>
                        {t('Please review the Tonhub Wallet ')}
                    </Text>
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 14, color: '#1C8FE3'
                        }}
                        onPress={() => navigation.navigate('Privacy')}>
                        {t('Privacy policy')}
                    </Text>
                    <Text style={{
                        textAlign: 'center',
                        color: '#8E979D',
                        fontSize: 14,
                    }}>
                        {t(' and ')}
                    </Text>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#1C8FE3'
                    }}
                        onPress={() => navigation.navigate('Terms')}>
                        {t('Terms of Service')}
                    </Text>
                </View>
            </FragmentMediaContent >
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Accept")} onPress={() => route.name === 'LegalCreate' ? navigation.replace('WalletCreate') : navigation.replace('WalletImport')} />
            </View>
        </View >
    );
});