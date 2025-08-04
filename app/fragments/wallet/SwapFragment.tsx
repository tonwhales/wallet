import { useCallback } from "react";
import { View, Text, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useCurrentAddress, useNetwork, useSolanaTokens, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { Typography } from "../../components/styles";
import { SpecialJettonProduct } from "../../components/products/savings/SpecialJettonProduct";
import { SolanaWalletProduct } from "../../components/products/savings/SolanaWalletProduct";
import { SolanaTokenProduct } from "../../components/products/savings/SolanaTokenProduct";
import { SolanaToken } from "../../engine/api/solana/fetchSolanaTokens";
import { AssetType, Currency } from "../../engine/types/deposit";
import { TonProductComponent } from "../../components/products/savings/TonWalletProduct";

type ListItem = { type: AssetType.TON }
    | { type: AssetType.SPECIAL }
    | { type: AssetType.SOLANA }
    | { type: AssetType.SOLANA_TOKEN, token: SolanaToken };


export const SwapFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const { tonAddress, solanaAddress, isLedger } = useCurrentAddress();
    const tokens = useSolanaTokens(solanaAddress!, isLedger);

    const solanaTokens: SolanaToken[] = tokens?.data ?? [];

    const onCurrencySelected = useCallback((currencyTo: Currency) => {
        navigation.navigateChangellyList({ currencyTo });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case AssetType.SPECIAL:
                return (
                    <SpecialJettonProduct
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={tonAddress}
                        testOnly={isTestnet}
                        assetCallback={() => onCurrencySelected(Currency.UsdTon)}
                    />
                );
            case AssetType.SOLANA:
                return (
                    solanaAddress ?
                        <SolanaWalletProduct
                            theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                            address={solanaAddress}
                            onSelect={() => onCurrencySelected(Currency.Sol)}
                        /> : null
                );
            case AssetType.SOLANA_TOKEN:
                return (
                    solanaAddress ?
                        <SolanaTokenProduct
                            theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                            token={item.token}
                            address={solanaAddress}
                            onSelect={() => onCurrencySelected(Currency.UsdcSol)}
                        /> : null
                );
            default:
                return (
                    <TonProductComponent
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={tonAddress}
                        testOnly={isTestnet}
                        onSelect={() => onCurrencySelected(Currency.Ton)}
                        isLedger={isLedger}
                    />
                );
        }
    }, [tonAddress, isTestnet, theme, solanaAddress, onCurrencySelected]);

    const renderSectionHeader = useCallback(() => {
        return (
            <Text style={[{ color: theme.textSecondary, marginVertical: 16 }, Typography.regular17_24]}>
                {t('order.chooseAsset')}
            </Text>
        );
    }, [theme]);

    const defaultSection: { data: ListItem[] } = {
        data: [
            { type: AssetType.TON },
            { type: AssetType.SPECIAL },
            { type: AssetType.SOLANA },
            ...solanaTokens.map((t) => ({
                type: AssetType.SOLANA_TOKEN as AssetType.SOLANA_TOKEN,
                token: t
            }))
        ]
    }

    const itemsList = [defaultSection];

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('wallet.actions.swap')}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <SectionList
                sections={itemsList}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(item, index) => `swap-asset-${index}`}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    );
});
