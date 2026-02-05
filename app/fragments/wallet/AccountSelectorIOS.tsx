import React, { useCallback, useMemo } from "react";
import { Pressable, View, Dimensions, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { useParams } from "../../utils/useParams";
import { StatusBar } from "expo-status-bar";
import { Typography } from "../../components/styles";
import { CloseButton } from "../../components/navigation/CloseButton";
import { AccountSelectorParams } from "./AccountSelectorFragment";
import { isAfterGlassIOS } from "../../utils";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const AccountSelectorIOS = React.memo(() => {
    const theme = useTheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const { callback, addressesCount } = useParams<AccountSelectorParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const isLedgerConnected = !!ledgerContext.tonTransport;

    // Capture layout values ONCE on mount to prevent shifts
    const { sheetHeight, bottomInset } = useMemo(() => {
        // iOS 26+ has new glass design with less chrome, needs less padding
        const extraPadding = isAfterGlassIOS ? 0 : 72;

        let height: number;
        if (addressesCount > 3) {
            height = SCREEN_HEIGHT - safeArea.top;
        } else {
            // Base height for title + button + padding
            const baseHeight = 160 + 24 + 56 + 50 + 16;
            // Each wallet item is ~80px
            const itemsHeight = Math.min(addressesCount, 3) * 88;
            height = baseHeight + itemsHeight + safeArea.bottom;
        }

        return { sheetHeight: height, bottomInset: safeArea.bottom + extraPadding };
    }, []); // Empty deps - capture once on mount

    const showCloseButton = addressesCount > 3;

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
        <View style={styles.container}>
            <StatusBar style="light" />

            <Pressable
                onPress={navigation.goBack}
                style={StyleSheet.absoluteFill}
            />

            <View style={[
                styles.sheet,
                {
                    top: SCREEN_HEIGHT - sheetHeight,
                    height: sheetHeight,
                    backgroundColor: theme.elevation,
                    paddingBottom: bottomInset
                }
            ]}>
                <View style={[
                    styles.header,
                    showCloseButton && styles.headerWithClose
                ]}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {t('common.wallets')}
                    </Text>
                    {showCloseButton && <CloseButton />}
                </View>

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
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // Note: top is set dynamically based on SCREEN_HEIGHT - sheetHeight
    },
    header: {
        marginHorizontal: 16,
        marginTop: 32,
        marginBottom: 16,
    },
    headerWithClose: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listContainer: {
        flex: 1,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
});

