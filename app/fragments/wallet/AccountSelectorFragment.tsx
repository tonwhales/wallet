import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, View, useWindowDimensions, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppState, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { useParams } from "../../utils/useParams";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Typography } from "../../components/styles";

export const AccountSelectorFragment = fragment(() => {
    const theme = useTheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const { callback } = useParams<{ callback?: (address: Address) => void }>();
    const dimentions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const appState = useAppState();

    const ledgerContext = useLedgerTransport();
    const isLedgerConnected = useMemo(() => {
        if (!ledgerContext?.tonTransport || !ledgerContext.addr?.address) {
            return false;
        }
        try {
            Address.parse(ledgerContext.addr?.address);
            return true;
        } catch {
            return false;
        }
    }, [ledgerContext]);

    const addressesCount = appState.addresses.length + ledgerContext.ledgerWallets.length;

    const heightMultiplier = useMemo(() => {
        const heightDependentMultiplier = dimentions.height > 800 ? 0 : .1;
        let multiplier = 1;
        if (addressesCount === 1) {
            multiplier = .5 + heightDependentMultiplier;
        } else if (addressesCount === 2) {
            multiplier = .52 + heightDependentMultiplier;
        } else if (addressesCount === 3) {
            multiplier = .7 + heightDependentMultiplier;
        } else if (addressesCount === 4) {
            multiplier = .8;
        }
        return multiplier;
    }, [addressesCount, dimentions.height]);

    const isScrollMode = useMemo(() => addressesCount > 3, [addressesCount]);

    const onAddNewAccount = useCallback(() => {
        const options = isLedgerConnected
            ? [t('common.cancel'), t('create.addNew'), t('welcome.importWallet')]
            : [t('common.cancel'), t('create.addNew'), t('welcome.importWallet'), t('hardwareWallet.actions.connect')];
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
                    ledgerContext.reset();
                    navigation.replace('Ledger');
                    break;
                default:
                    break;
            }
        });
    }, []);

    return (
        <View style={[
            { flexGrow: 1, justifyContent: 'flex-end' },
            Platform.select({
                ios: { paddingBottom: isScrollMode ? 0 : safeArea.bottom === 0 ? 32 : safeArea.bottom, },
                android: { paddingTop: safeArea.top, backgroundColor: theme.backgroundPrimary, }
            })
        ]}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.OS === 'android' ? (
                <ScreenHeader
                    title={t('common.wallets')}
                    onBackPressed={navigation.goBack}
                    style={{ paddingHorizontal: 16 }}
                />
            ) : (
                <Pressable
                    onPress={navigation.goBack}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
            )}
            {isScrollMode ? (
                <View style={{
                    flex: 1,
                    backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    {Platform.OS === 'ios' && (
                        <Text style={[{
                            fontWeight: '600',
                            color: theme.textPrimary,
                            marginTop: Platform.OS === 'ios' ? 32 : 0,
                        }, Typography.semiBold17_24]}>
                            {t('common.wallets')}
                        </Text>
                    )}
                    <WalletSelector onSelect={callback} />
                    {!callback && (
                        <RoundButton
                            style={{ marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom + 16 }}
                            onPress={onAddNewAccount}
                            title={t('wallets.addNewTitle')}
                        />
                    )}
                </View>
            ) : (
                <View style={{
                    height: Platform.OS === 'ios' ? (Math.floor(dimentions.height * heightMultiplier)) : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    {Platform.OS === 'ios' && (
                        <Text style={[{
                            marginHorizontal: 16,
                            marginBottom: 16,
                            color: theme.textPrimary,
                            marginTop: Platform.OS === 'ios' ? 32 : 0,
                        }, Typography.semiBold17_24]}>
                            {t('common.wallets')}
                        </Text>
                    )}
                    <WalletSelector onSelect={callback} />
                    {!callback && (
                        <View style={{ paddingHorizontal: 16 }}>
                            <RoundButton
                                style={{ marginVertical: 16 }}
                                onPress={onAddNewAccount}
                                title={t('wallets.addNewTitle')}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
});