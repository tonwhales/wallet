import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, ScrollView, ActionSheetIOS, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../analytics/mixpanel";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { holdersUrl } from "../engine/corp/ZenPayProduct";
import { Engine, useEngine } from "../engine/Engine";
import { extractDomain } from "../engine/utils/extractDomain";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { storage } from "../storage/storage";
import { useReboot } from "../utils/RebootContext";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { getAppState, getCurrentAddress } from "../storage/appState";
import { useAppStateManager } from "../engine/AppStateManager";
import { Address } from "ton";
import { loadWalletKeys } from "../storage/walletKeys";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";

export function clearZenPay(engine: Engine, address?: Address) {
    const zenPayDomain = extractDomain(holdersUrl);
    engine.products.zenPay.stopWatching();
    engine.persistence.domainKeys.setValue(
        `${(address ?? engine.address).toFriendly({ testOnly: engine.isTestnet })}/${zenPayDomain}`,
        null
    );
    engine.persistence.zenPayState.setValue(address ?? engine.address, null);
    engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
}

export const LogoutFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const authContext = useKeysAuth();
    const { showActionSheetWithOptions } = useActionSheet();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    const engine = useEngine();

    const onLogout = React.useCallback(async () => {
        const appState = getAppState();
        const acc = getCurrentAddress();
        const currentAddress = acc.address;

        try {
            await authContext.authenticate({ cancelable: true });
        } catch (e) {
            navigation.goBack();
            return;
        }

        mixpanelReset(AppConfig.isTestnet) // Clear super properties and generates a new random distinctId
        trackEvent(MixpanelEvent.Reset, undefined, AppConfig.isTestnet);
        mixpanelFlush(AppConfig.isTestnet);

        if (appState.addresses.length === 1) {
            storage.clearAll();
            clearZenPay(engine);
            reboot();
            return;
        }

        clearZenPay(engine, currentAddress);

        const newAddresses = appState.addresses.filter((address) => !address.address.equals(currentAddress));

        appStateManager.updateAppState({
            addresses: newAddresses,
            selected: 0,
        });

    }, []);

    const logoutActionSheet = React.useCallback(() => {
        const options = [t('common.cancel'), t('deleteAccount.logOutAndDelete')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('confirm.logout.title'),
            message: t('confirm.logout.message'),
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    // Create new wallet
                    onLogout();
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
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
                    onPress={logoutActionSheet}
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