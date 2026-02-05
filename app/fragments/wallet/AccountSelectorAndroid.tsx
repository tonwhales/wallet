import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { useParams } from "../../utils/useParams";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { AccountSelectorParams } from "./AccountSelectorFragment";

export const AccountSelectorAndroid = React.memo(() => {
    const theme = useTheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const { callback } = useParams<AccountSelectorParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const isLedgerConnected = !!ledgerContext.tonTransport;

    const onAddNewAccount = useCallback(() => {
        const options = [
            t('common.cancel'),
            t('create.addNew'),
            t('welcome.importWallet'),
            t('hardwareWallet.actions.connect')
        ];

        showActionSheetWithOptions({
            options,
            cancelButtonIndex: 0,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    navigation.goBack();
                    setTimeout(() => {
                        navigation.navigateWalletCreate({ additionalWallet: true });
                    }, 50);
                    break;
                case 2:
                    navigation.goBack();
                    setTimeout(() => {
                        navigation.navigateWalletImport({ additionalWallet: true });
                    }, 50);
                    break;
                case 3:
                    if (isLedgerConnected) {
                        navigation.navigateLedgerSelectAccount({ selectedAddress: ledgerContext.addr });
                        return;
                    }
                    ledgerContext.reset();
                    navigation.replace('Ledger');
                    break;
            }
        });
    }, [isLedgerConnected, ledgerContext.addr]);

    return (
        <View style={[
            styles.container,
            {
                paddingTop: safeArea.top,
                backgroundColor: theme.backgroundPrimary,
                paddingBottom: safeArea.bottom
            }
        ]}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            
            <ScreenHeader
                title={t('common.wallets')}
                onBackPressed={navigation.goBack}
                style={styles.header}
            />

            <View style={styles.listContainer}>
                <WalletSelector onSelect={callback} />
            </View>

            {!callback && (
                <View style={styles.buttonContainer}>
                    <RoundButton
                        onPress={onAddNewAccount}
                        title={t('wallets.addNewTitle')}
                    />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
    },
    listContainer: {
        flex: 1,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});

