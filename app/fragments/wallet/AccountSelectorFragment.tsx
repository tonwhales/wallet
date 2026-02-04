import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, View, Dimensions, Text } from "react-native";
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
import { CloseButton } from "../../components/navigation/CloseButton";

export const AccountSelectorFragment = fragment(() => {
    const theme = useTheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const { callback } = useParams<{ callback?: (address: Address) => void }>();
    const screenHeight = Dimensions.get('window').height;
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const appState = useAppState();

    const ledgerContext = useLedgerTransport();
    const isLedgerConnected = !!ledgerContext.tonTransport;

    const addressesCount = appState.addresses.length + ledgerContext.wallets.length;

    const heightMultiplier = useMemo(() => {
        const heightDependentMultiplier = screenHeight > 800 ? 0 : .1;
        let multiplier = 1;
        if (addressesCount <= 1) {
            multiplier = .5 + heightDependentMultiplier;
        } else if (addressesCount === 2) {
            multiplier = .52 + heightDependentMultiplier;
        } else if (addressesCount === 3) {
            multiplier = .7 + heightDependentMultiplier;
        } else if (addressesCount === 4) {
            multiplier = .8;
        }
        return multiplier;
    }, [addressesCount, screenHeight]);

    const isScrollMode = useMemo(() => addressesCount > 3, [addressesCount]);

    const onAddNewAccount = useCallback(() => {
        const options = [
            t('common.cancel'),
            t('create.addNew'),
            t('welcome.importWallet'),
            t('hardwareWallet.actions.connect')
        ];

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
                    if (isLedgerConnected) {
                        navigation.navigateLedgerSelectAccount({ selectedAddress: ledgerContext.addr });
                        return;
                    }

                    ledgerContext.reset();
                    navigation.replace('Ledger');
                    break;
                default:
                    break;
            }
        });
    }, [isLedgerConnected, ledgerContext.addr]);

    return (
        <View style={[
            { flexGrow: 1, justifyContent: 'flex-end' },
            Platform.select({
                android: { paddingTop: safeArea.top, backgroundColor: theme.backgroundPrimary }
            })
        ]}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.select({
                android: (
                    <ScreenHeader
                        title={t('common.wallets')}
                        onBackPressed={navigation.goBack}
                        style={{ paddingHorizontal: 16 }}
                    />
                ),
                ios: (
                    <Pressable
                        onPress={navigation.goBack}
                        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    />
                )
            })}
            {isScrollMode ? (
                <View style={{
                    flex: 1,
                    ...Platform.select({
                        android: { backgroundColor: theme.backgroundPrimary, paddingBottom: safeArea.bottom + 16 },
                        ios: {
                            backgroundColor: theme.elevation,
                            borderTopEndRadius: 20,
                            borderTopStartRadius: 20,
                            paddingBottom: Math.max(safeArea.bottom, 34) + 16
                        }
                    })
                }}>
                    {Platform.select({
                        ios: (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                marginHorizontal: 16,
                                marginBottom: 16,
                                marginTop: safeArea.top
                            }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {t('common.wallets')}
                                </Text>
                                <CloseButton />
                            </View>
                        )
                    })}
                    <WalletSelector onSelect={callback} />
                    {!callback && (
                        <RoundButton
                            style={{ marginHorizontal: 16, marginTop: 16 }}
                            onPress={onAddNewAccount}
                            title={t('wallets.addNewTitle')}
                        />
                    )}
                </View>
            ) : (
                <View style={[{
                    ...Platform.select({
                        android: {
                            flexGrow: 1,
                            backgroundColor: theme.backgroundPrimary,
                            paddingBottom: safeArea.bottom
                        },
                        ios: {
                            height: Math.floor(screenHeight * heightMultiplier),
                            flexGrow: 0,
                            backgroundColor: theme.elevation,
                            borderTopEndRadius: 20,
                            borderTopStartRadius: 20,
                            paddingBottom: Math.max(safeArea.bottom, 34) + 16
                        }
                    })
                }]}>
                    {Platform.select({
                        ios: (
                            <Text style={[{
                                marginHorizontal: 16,
                                marginBottom: 16,
                                color: theme.textPrimary,
                                marginTop: 32
                            }, Typography.semiBold17_24]}>
                                {t('common.wallets')}
                            </Text>
                        )
                    })}
                    <WalletSelector onSelect={callback} />
                    {!callback && (
                        <View style={{ paddingHorizontal: 16 }}>
                            <RoundButton
                                style={{ marginTop: 16 }}
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