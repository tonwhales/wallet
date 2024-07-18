import React, { useCallback, useState } from "react";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemButton } from "../components/ItemButton";
import { openWithInApp } from "../utils/openWithInApp";
import { useTheme } from "../engine/hooks";
import { useDeleteCurrentAccount } from "../engine/hooks/appstate/useDeleteCurrentAccount";
import { StatusBar } from "expo-status-bar";
import { getAppState } from "../storage/appState";
import { getHasHoldersProducts } from "../engine/hooks/holders/useHasHoldersProducts";

import IcLogout from '@assets/ic-alert-red.svg';
import Support from '@assets/ic-support.svg';

function hasHoldersProductsOnDevice(isTestnet: boolean) {
    const appState = getAppState();

    return !!appState.addresses.find((acc) => {
        return getHasHoldersProducts(acc.address.toString({ testOnly: isTestnet }));
    });
}

export const LogoutFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const { showActionSheetWithOptions } = useActionSheet();
    const onAccountDeleted = useDeleteCurrentAccount();

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
                    onAccountDeleted();
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
            setIsShown(false);
        });
    }, [isShown, onAccountDeleted]);

    return (
        <View style={{
            flexGrow: 1,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('common.logout')}
                onBackPressed={navigation.goBack}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { marginTop: safeArea.top } })
                ]}
            />
            <View style={{ paddingHorizontal: 16, flexGrow: 1, marginTop: 16 }}>
                <View style={{
                    backgroundColor: 'rgba(255, 65, 92, 0.10)',
                    borderRadius: 20, padding: 20,
                    marginBottom: 16
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IcLogout width={24} height={24} color={theme.accentRed} />
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            marginLeft: 12,
                            fontWeight: '600',
                            color: theme.accentRed,
                        }}>
                            {t('common.attention')}
                        </Text>
                    </View>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: theme.accentRed,
                    }}>
                        {t('logout.logoutDescription')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
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
                        leftIcon={require('@assets/ic-backup.png')}
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