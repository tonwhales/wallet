import { useRoute } from "@react-navigation/native";
import React from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { markAsTermsAccepted } from "../../storage/appState";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useAppConfig } from "../../utils/AppConfigContext";

export const LegalFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const onAccept = React.useCallback(() => {
        markAsTermsAccepted()
        if (route.name === 'LegalCreate') {
            navigation.replace('WalletCreate');
        } else {
            navigation.replace('WalletImport');
        }
    }, []);
    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: 'white',
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
            paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 16) + 16 : 0,
        }}>
            <AndroidToolbar pageTitle={t('legal.title')} />
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                animation={require('../../../assets/animations/paper.json')}
                title={t('legal.title')}
            >
                <Text style={{
                    textAlign: 'center',
                    color: Theme.textSubtitle,
                    fontSize: 14,
                    marginTop: 14,
                }}>
                    <Text>
                        {t('legal.subtitle') + ' '}
                    </Text>
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 14, color: Theme.accentText
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
                        color: Theme.accentText
                    }}
                        onPress={() => navigation.navigate('Terms')}>
                        {t('legal.termsOfService')}
                    </Text>
                </View>
            </FragmentMediaContent >
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t('common.accept')} onPress={onAccept} />
            </View>
        </View >
    );
});