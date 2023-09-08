import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
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
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemButton } from "../components/ItemButton";
import { openWithInApp } from "../utils/openWithInApp";

import IcLogout from '../../assets/ic-alert-red.svg';
import Support from '../../assets/ic-support.svg';

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

    const onSupport = useCallback(() => {
        const options = [t('common.cancel'), t('settings.support.telegram'), t('settings.support.form')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            title: t('settings.support.title'),
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp('https://t.me/WhalesSupportBot');
                    break;
                case 2:
                    openWithInApp('https://airtable.com/appWErwfR8x0o7vmz/shr81d2H644BNUtPN');
                    break;
                default:
                    break;
            }
        });
    }, []);

    const [isShown, setIsShown] = useState(false);

    const onLogout = useCallback(async () => {
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

    const showLogoutActSheet = useCallback(() => {
        if (isShown) {
            return;
        }
        const options = [t('common.cancel'), t('deleteAccount.logOutAndDelete')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        setIsShown(true);

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
            setIsShown(false);
        });
    }, [isShown]);

    return (
        <View style={{
            flexGrow: 1,
            paddingBottom: safeArea.bottom,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('common.logout')}
                onBackPressed={navigation.goBack}
            />
            <View style={{ paddingHorizontal: 16, flexGrow: 1, marginTop: 16 }}>
                <View style={{
                    backgroundColor: 'rgba(255, 65, 92, 0.10)',
                    borderRadius: 20, padding: 20,
                    marginBottom: 16
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                        <IcLogout width={24} height={24} color={Theme.accentRed} />
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            marginLeft: 12,
                            fontWeight: '600',
                            color: Theme.accentRed,
                        }}>
                            {t('common.attention')}
                        </Text>
                    </View>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: Theme.accentRed,
                    }}>
                        {t('logout.logoutDescription')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<Support width={24} height={24} />}
                        title={t('settings.support.title')}
                        onPress={onSupport}
                    />
                    <ItemButton
                        leftIcon={require('../../assets/ic-backup.png')}
                        title={t('settings.backupKeys')}
                        onPress={() => navigation.navigate('WalletBackupLogout', { back: true })}
                    />
                </View>
                <View style={{ flexGrow: 1 }} />
                <View style={{ marginBottom: 16 }}>
                    <RoundButton
                        title={t('common.logout')}
                        onPress={showLogoutActSheet}
                        display={'default'}
                        style={{ marginBottom: 16 }}
                    />
                </View>
            </View>
        </View>
    );
});