import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useAppStateManager } from "../../engine/AppStateManager";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";
import { useAppConfig } from "../../utils/AppConfigContext";
import { getAppState } from "../../storage/appState";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";

export const AccountSelectorFragment = fragment(() => {
    const appStateManager = useAppStateManager();
    const { Theme } = useAppConfig();
    const { showActionSheetWithOptions } = useActionSheet();
    const dimentions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const ledgerConnected = !!ledgerContext?.tonTransport;
    const heightMultiplier = useMemo(() => {
        const addressesCount = appStateManager.current.addresses.length + (ledgerConnected ? 1 : 0);
        let multiplier = .8;
        if (addressesCount === 1) {
            multiplier = .5;
        } else if (addressesCount === 2) {
            multiplier = .52;
        } else if (addressesCount === 3) {
            multiplier = .7;
        } else if (addressesCount === 4) {
            multiplier = .8;
        }
        return multiplier;
    }, [appStateManager.current.addresses, ledgerConnected]);

    const onAddNewAccount = useCallback(() => {
        const appState = getAppState();

        const options = appState.addresses.length >= 3
            ? [t('common.cancel'), t('hardwareWallet.actions.connect')]
            : [t('common.cancel'), t('create.addNew'), t('welcome.importWallet'), t('hardwareWallet.actions.connect')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {

            if (appState.addresses.length >= 3) {
                if (selectedIndex === 1) {
                    navigation.replace('Ledger');
                }
                return;
            }

            switch (selectedIndex) {
                case 1:
                    navigation.goBack();
                    setTimeout(() => {
                        navigation.navigate('WalletCreate', { additionalWallet: true });
                    }, 50);
                    break;
                case 2:
                    navigation.goBack();
                    setTimeout(() => {
                        navigation.navigate('WalletImport', { additionalWallet: true });
                    }, 50);
                    break;
                case 3:
                    navigation.replace('Ledger');
                    break;
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
            paddingBottom: safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? Theme.white : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar />
            {Platform.OS === 'ios' && (
                <Pressable
                    onPress={navigation.goBack}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
            )}
            <View style={{
                height: Platform.OS === 'ios' ? (Math.floor(dimentions.height * heightMultiplier)) : undefined,
                flexGrow: Platform.OS === 'ios' ? 0 : 1,
                backgroundColor: Theme.white,
                borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                padding: 16,
                paddingBottom: safeArea.bottom + 16
            }}>
                <WalletSelector />
                <RoundButton
                    style={{ marginVertical: 16 }}
                    onPress={onAddNewAccount}
                    title={t('wallets.addNewTitle')}
                />
            </View>
        </View>
    );
});