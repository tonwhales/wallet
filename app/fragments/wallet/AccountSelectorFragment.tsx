import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
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
        const options = [t('common.cancel'), t('create.addNew'), t('welcome.importWallet'), t('hardwareWallet.actions.connect')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    navigation.replace('WalletCreate', { additionalWallet: true });
                    break;
                case 2:
                    navigation.replace('WalletImport', { additionalWallet: true });
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
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{
                height: (Math.floor(dimentions.height * heightMultiplier)),
                backgroundColor: Theme.white,
                borderTopEndRadius: 20, borderTopStartRadius: 20,
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