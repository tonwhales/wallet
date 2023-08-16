import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, useWindowDimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../analytics/mixpanel";
import { RoundButton } from "../components/RoundButton";
import { holdersUrl } from "../engine/holders/HoldersProduct";
import { Engine, useEngine } from "../engine/Engine";
import { extractDomain } from "../engine/utils/extractDomain";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { sharedStoragePersistence, storage, storagePersistence } from "../storage/storage";
import { useReboot } from "../utils/RebootContext";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { getAppState, getCurrentAddress } from "../storage/appState";
import { useAppStateManager } from "../engine/AppStateManager";
import { Address } from "ton";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";

export function clearHolders(engine: Engine, address?: Address) {
    const holdersDomain = extractDomain(holdersUrl);
    engine.products.holders.stopWatching();
    engine.persistence.domainKeys.setValue(
        `${(address ?? engine.address).toFriendly({ testOnly: engine.isTestnet })}/${holdersDomain}`,
        null
    );
    engine.persistence.holdersState.setValue(address ?? engine.address, null);
    engine.products.holders.deleteToken()
}

export const LogoutFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const authContext = useKeysAuth();
    const dimentions = useWindowDimensions();
    const { showActionSheetWithOptions } = useActionSheet();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    const engine = useEngine();
    const wallets = engine.products.wallets;
    const acc = getCurrentAddress();
    const appState = getAppState();
    const name = wallets.useWalletSettings(acc.address)?.name ?? `${t('common.wallet')} ${appState.selected + 1}`;


    const onLogout = React.useCallback(async () => {
        const currentAddress = acc.address;

        try {
            await authContext.authenticate({ cancelable: true, showResetOnMaxAttempts: true });
        } catch (e) {
            navigation.goBack();
            return;
        }

        mixpanelReset(AppConfig.isTestnet) // Clear super properties and generates a new random distinctId
        trackEvent(MixpanelEvent.Reset, undefined, AppConfig.isTestnet);
        mixpanelFlush(AppConfig.isTestnet);

        if (appState.addresses.length === 1) {
            storage.clearAll();
            sharedStoragePersistence.clearAll();
            storagePersistence.clearAll();
            clearHolders(engine);
            reboot();
            return;
        }

        clearHolders(engine, currentAddress);

        const newAddresses = appState.addresses.filter((address) => !address.address.equals(currentAddress));

        appStateManager.updateAppState({
            addresses: newAddresses,
            selected: newAddresses.length > 0 ? 0 : -1,
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
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <Pressable
                onPress={navigation.goBack}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
            <View style={{
                height: (dimentions.height / 2),
                backgroundColor: 'white', borderTopEndRadius: 20, borderTopStartRadius: 20,
                padding: 16,
            }}>
                <Text style={{
                    marginTop: 24,
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    color: Theme.textColor,
                }}
                >
                    {t('logout.title', { name: name.length > 20 ? name.slice(0, 10) + '...' + name.slice(-10) : name })}
                </Text>
                <Text style={{ color: Theme.darkGrey, fontSize: 17, lineHeight: 24, fontWeight: '400', marginTop: 12 }}>
                    {t('logout.logoutDescription')}
                </Text>
                <View style={{ flexGrow: 1 }} />
                <View style={{ marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton
                        title={t('common.logout')}
                        onPress={logoutActionSheet}
                        display={'default'}
                        style={{ marginBottom: 16 }}
                    />
                    <RoundButton
                        title={t('common.cancel')}
                        onPress={navigation.goBack}
                        display={'secondary'}
                    />
                </View>
            </View>
        </View>
    );
});