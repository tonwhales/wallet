import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { FlatList } from "react-native";
import { getChainShortNameByChain, getCoinInfoByCurrency, getKnownCurrencyFromName } from "../../engine/utils/chain";
import { CoinItem } from "../../components/products/savings/CoinItem";
import { Currency } from "../../engine/types/deposit";
import { useChangellyCurrencies } from "../../engine/hooks/changelly/useChangellyCurrencies";
import { ChangellyCurrency } from "../../engine/api/changelly";
import { AnimatedSkeleton } from "../../components/skeletons/AnimatedSkeleton";
import { ASSET_ITEM_HEIGHT } from "../../utils/constants";

export type ChangellyListFragmentParams = {
    currencyTo: Currency;
}

export const ChangellyListFragment = fragment(() => {
    const { currencyTo } = useParams<ChangellyListFragmentParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const currencies = useChangellyCurrencies(currencyTo)?.data;

    const onCoinPress = useCallback((item: ChangellyCurrency) => {
        navigation.navigateChangellyCalculation({
            currencyTo,
            currencyFrom: item,
        })
    }, [])

    const renderItem = useCallback(({ item }: { item: ChangellyCurrency }) => {
        const originKnownCurrency = getKnownCurrencyFromName(item.name);
        const originCoinName = originKnownCurrency ? getCoinInfoByCurrency(originKnownCurrency).name : item.name;
        const originBlockchainTag = getChainShortNameByChain(item.blockchain) || item.blockchain?.toUpperCase();
        const originBlockchainName = (item.blockchain || '').charAt(0).toUpperCase() + (item.blockchain || []).slice(1);

        return (
            <CoinItem
                theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                imageUrl={item.image}
                currency={originKnownCurrency}
                name={originCoinName}
                blockchain={item.blockchain}
                tag={originBlockchainTag}
                description={t('products.holders.accounts.network', { networkName: originBlockchainName })}
                onPress={() => onCoinPress(item)}
                withArrow
            />
        );
    }, [theme, currencyTo]);

    const skeleton = useMemo(() => {
        return (
            <View style={{ gap: 16 }}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <AnimatedSkeleton key={index} height={ASSET_ITEM_HEIGHT} style={{
                        borderRadius: 20,
                    }} />
                ))}
            </View>
        );
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('order.chooseCrypto')}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <FlatList
                data={currencies}
                renderItem={renderItem}
                removeClippedSubviews={true}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                ListEmptyComponent={skeleton}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(_, index) => `changelly-i-${index}`}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    );
});