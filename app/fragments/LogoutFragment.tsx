import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, ScrollView, ActionSheetIOS, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mixpanel, MixpanelEvent, trackEvent } from "../analytics/mixpanel";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { storage } from "../storage/storage";
import { Theme } from "../Theme";
import { useReboot } from "../utils/RebootContext";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const LogoutFragment = fragment(() => {
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
                        mixpanel.reset(); // Clear super properties and generates a new random distinctId
                        trackEvent(MixpanelEvent.Reset);
                        mixpanel.flush();
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
                        mixpanel.reset(); // Clear super properties and generates a new random distinctId
                        trackEvent(MixpanelEvent.Reset);
                        mixpanel.flush();
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
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
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