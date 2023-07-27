import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, ScrollView, ActionSheetIOS, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../analytics/mixpanel";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { zenPayUrl } from "../engine/corp/ZenPayProduct";
import { Engine, useEngine } from "../engine/Engine";
import { extractDomain } from "../engine/utils/extractDomain";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { storage } from "../storage/storage";
import { useReboot } from "../utils/RebootContext";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";

export function clearZenPay(engine: Engine) {
    const zenPayDomain = extractDomain(zenPayUrl);
    engine.persistence.domainKeys.setValue(zenPayDomain, null);
    engine.persistence.holdersState.setValue(engine.address, null);
    engine.products.zenPay.stopWatching();
    engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
}

export const LogoutFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    const engine = useEngine();

    const onDeletetAccount = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: t('confirm.logout.title'),
                    message: t('confirm.logout.message'),
                    options: [t('common.cancel'), t('deleteAccount.logOutAndDelete')],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        storage.clearAll();
                        clearZenPay(engine);
                        mixpanelReset(AppConfig.isTestnet) // Clear super properties and generates a new random distinctId
                        trackEvent(MixpanelEvent.Reset, undefined, AppConfig.isTestnet);
                        mixpanelFlush(AppConfig.isTestnet);
                        reboot();
                    }
                }
            );
        } else {
            Alert.alert(
                t('confirm.logout.title'),
                t('confirm.logout.message'),
                [{
                    text: t('deleteAccount.logOutAndDelete'), style: 'destructive', onPress: () => {
                        storage.clearAll();
                        clearZenPay(engine);
                        mixpanelReset(AppConfig.isTestnet) // Clear super properties and generates a new random distinctId
                        trackEvent(MixpanelEvent.Reset, undefined, AppConfig.isTestnet);
                        mixpanelFlush(AppConfig.isTestnet);
                        reboot();
                    }
                }, { text: t('common.cancel') }])
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('common.logout')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('common.logout')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16
                }}>
                    <View style={{ marginRight: 10, marginLeft: 10, marginTop: 8 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 14 }}>
                            {t('settings.logoutDescription')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton
                    title={t('common.logout')}
                    onPress={onDeletetAccount}
                    display={'danger_zone'}
                />
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});