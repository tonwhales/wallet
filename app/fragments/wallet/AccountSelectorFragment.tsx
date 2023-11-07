import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, ScrollView, View, useWindowDimensions, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useAppState, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";

export const AccountSelectorFragment = fragment(() => {
    const theme = useTheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const dimentions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const appState = useAppState();
    
    const ledgerContext = useLedgerTransport();
    const ledgerConnected = !!ledgerContext?.tonTransport;
    
    const addressesCount = appState.addresses.length + (ledgerConnected ? 1 : 0);

    const heightMultiplier = useMemo(() => {
        let multiplier = 1;
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
    }, [addressesCount, ledgerConnected]);

    const isScrollMode = useMemo(() => {
        return addressesCount + (ledgerConnected ? 1 : 0) > 3;
    }, [addressesCount, ledgerConnected]);

    const onAddNewAccount = useCallback(() => {
        const options = [t('common.cancel'), t('create.addNew'), t('welcome.importWallet'), t('hardwareWallet.actions.connect')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {

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
            paddingBottom: isScrollMode ? 0 : safeArea.bottom === 0 ? 32 : safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? theme.background : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar />
            {Platform.OS === 'ios' && (
                <Pressable
                    onPress={navigation.goBack}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
            )}
            {isScrollMode ? (
                <View style={{
                    flex: 1, backgroundColor: theme.background,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        marginHorizontal: 16,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginTop: Platform.OS === 'ios' ? 32 : 0,
                    }}>
                        {t('common.wallets')}
                    </Text>
                    <ScrollView
                        style={{
                        }}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                        }}
                        contentInset={{
                            bottom: safeArea.bottom + 16,
                            top: 16
                        }}
                    >
                        <WalletSelector />
                    </ScrollView>
                    <RoundButton
                        style={{ marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom + 16 }}
                        onPress={onAddNewAccount}
                        title={t('wallets.addNewTitle')}
                    />
                </View>
            ) : (
                <View style={{
                    height: Platform.OS === 'ios' ? (Math.floor(dimentions.height * heightMultiplier)) : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: theme.background,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 16, marginTop: Platform.OS === 'ios' ? 16 : 0,
                    }}>
                        {t('common.wallets')}
                    </Text>
                    <WalletSelector />
                    <RoundButton
                        style={{ marginVertical: 16 }}
                        onPress={onAddNewAccount}
                        title={t('wallets.addNewTitle')}
                    />
                </View>
            )}
        </View>
    );
});