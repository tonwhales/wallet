import { fragment } from "../../fragment";
import { usePrice, usePrimaryCurrency, useSolanaToken, useTheme } from "../../engine/hooks";
import { useUnifiedSolanaTransactions } from "../../engine/hooks/transactions/useUnifiedSolanaTransactions";
import { setStatusBarStyle } from "expo-status-bar";
import { Platform, View, Text } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { Typography } from "../../components/styles";
import { memo, Suspense, useCallback } from "react";
import { ValueComponent } from "../../components/ValueComponent";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { CurrencySymbols } from "../../utils/formatCurrency";
import { useFocusEffect } from "@react-navigation/native";
import { SolanaTransactions } from "./views/solana/SolanaTransactions";
import { SolanaWalletActions } from "./views/solana/SolanaWalletActions";
import { isSolanaAddress } from "../../utils/solana/address";
import { SolanaWalletAddress } from "../../components/address/SolanaWalletAddress";
import { solanaWalletFragmentStyles } from "./SolanaWalletFragment";
import { toNano } from "@ton/core";
import { PriceComponent } from "../../components/PriceComponent";
import { WImage } from "../../components/WImage";
import { ReceiveableSolanaAsset } from "./ReceiveFragment";
import { Image } from "expo-image";
import { usdyMintAddress } from "../../secure/KnownWallets";
import { SolanaTokenInfoView } from "./views/solana/SolanaTokenInfoView";
import { USDYRateAmination } from "./views/solana/USDYRateAmination";

import SolanaIcon from '@assets/ic-solana.svg';
import ArrowIcon from '@assets/order/arrow-without-background.svg';

export type SolanaTokenWalletFragmentProps = {
    owner: string,
    mint: string
}

const styles = solanaWalletFragmentStyles;

const SolanaWalletSkeleton = memo(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    return (
        <View style={styles.container}>
            <ScreenHeader
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />
            <View style={styles.skeletonContent}>
                <View style={[styles.skeletonIcon, { backgroundColor: theme.surfaceOnBg }]} />
                <View style={[styles.skeletonBalance, { backgroundColor: theme.surfaceOnBg }]} />
                <View style={[styles.skeletonActions, { backgroundColor: theme.surfaceOnBg }]} />
            </View>
        </View>
    );
});

const SolanaTokenHeader = memo(({ mint, owner }: { mint: string, owner: string }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const token = useSolanaToken(owner, mint);
    const bottomBarHeight = useBottomTabBarHeight();
    const [, , , usdyPriceData] = usePrice();
    const usdyPrice = usdyPriceData.price.usd;

    if (!token) {
        return null;
    }

    const isUsdy = mint === usdyMintAddress;

    const rate = isUsdy ? usdyPrice : 1;
    const balance = token.amount ?? 0n;
    const symbol = token.symbol ?? "?";
    const decimals = token.decimals ?? 6;
    const price = toNano((token.uiAmount ?? 0) * rate);
    const logoURI = token.logoURI ?? '';

    return (
        <View style={styles.content}>
            <View style={{
                width: 72, height: 72, borderRadius: 36,
                borderWidth: 0,
                backgroundColor: theme.surfaceOnBg,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <WImage
                    src={logoURI}
                    width={72}
                    height={72}
                    borderRadius={36}
                />
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    height: 30, width: 30, borderRadius: 15,
                    position: 'absolute', right: -2, bottom: -2,
                    backgroundColor: theme.surfaceOnBg
                }}>
                    <SolanaIcon
                        width={16}
                        height={16}
                        style={{
                            borderRadius: 8,
                            height: 16,
                            width: 16
                        }}
                    />
                </View>
            </View>
            <View style={{ marginTop: 16, width: '100%' }}>
                <View style={{ gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <SolanaWalletAddress
                        address={owner}
                        elipsise={{ start: 4, end: 4 }}
                        copyOnPress
                        disableContextMenu
                        copyToastProps={{ marginBottom: 70 + bottomBarHeight }}
                    />
                    {isUsdy ? (
                        <>
                            <USDYRateAmination
                                usdyRate={rate}
                                currentPrice={usdyPrice}
                                amount={token.uiAmount ?? 0}
                                cacheKey={`usdy-balance-${owner}`}
                                typography={{ fontSize: 32, lineHeight: 38, fontWeight: '600' }}
                                showIcon={true}
                                decimalPlaces={4}
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ValueComponent
                                    value={balance}
                                    decimals={decimals}
                                    precision={4}
                                    fontStyle={[Typography.regular15_20, { color: theme.accentGreen }]}
                                    centFontStyle={{ color: theme.accentGreen }}
                                    suffix={` ${symbol}`}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <ValueComponent
                                value={balance}
                                decimals={decimals}
                                precision={4}
                                fontStyle={[Typography.semiBold32_38, { color: theme.textPrimary }]}
                                centFontStyle={{ color: theme.textSecondary }}
                                suffix={` ${symbol}`}
                            />
                            <View>
                                <PriceComponent
                                    amount={price}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        height: undefined,
                                    }}
                                    textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                    theme={theme}
                                    priceUSD={1}
                                    hideCentsIfNull
                                />
                            </View>
                        </>
                    )}
                </View>
                <SolanaWalletActions
                    theme={theme}
                    navigation={navigation}
                    address={owner}
                    asset={{
                        mint: token.address,
                        content: {
                            icon: logoURI,
                            name: symbol
                        }
                    }}
                />
                <View style={{ marginTop: 16 }} />
                <SolanaTokenInfoView mint={mint} />
            </View>
        </View>
    );
});

const SolanaTokenWalletComponent = memo(({ owner, mint }: SolanaTokenWalletFragmentProps) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const {
        transactions,
        pendingCount,
        loading,
        refreshing,
        hasNext,
        next,
        refresh,
        markAsTimedOut
    } = useUnifiedSolanaTransactions(owner, mint);
    const token = useSolanaToken(owner, mint);
    const [, , , usdyPriceData] = usePrice();
    const usdyPrice = usdyPriceData.price.usd;

    const asset: ReceiveableSolanaAsset = {
        mint: mint,
        content: {
            icon: token?.logoURI,
            name: token?.symbol
        }
    }

    const onReachedEnd = useCallback(() => {
        if (hasNext) {
            next();
        }
    }, [next, hasNext]);

    const onRefresh = useCallback(() => {
        refresh();
        token?.refresh();
    }, [refresh, token?.refresh]);

    const [currency] = usePrimaryCurrency();

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    const rate = mint === usdyMintAddress ? usdyPrice : 1;

    return (
        <View style={styles.container}>
            <ScreenHeader
                onBackPressed={navigation.goBack}
                style={styles.header}
                titleComponent={(
                    <View style={styles.headerTitleComponent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text
                                style={[{ color: theme.textPrimary }, styles.headerTitle]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                {token?.symbol}
                            </Text>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 20, width: 20 }}
                            />
                        </View>
                        {!!rate && (
                            <Text
                                style={[{ color: theme.textSecondary }, styles.headerSubtitle]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                <ValueComponent
                                    value={BigInt(Math.round(Number(rate) * 100)) * 10n ** 7n}
                                    precision={2}
                                    suffix={CurrencySymbols[currency]?.symbol}
                                    forcePrecision
                                />
                            </Text>
                        )}
                    </View>
                )}
            />
            <SolanaTransactions
                theme={theme}
                txs={transactions}
                hasNext={hasNext}
                onLoadMore={onReachedEnd}
                onRefresh={onRefresh}
                loading={loading}
                owner={owner}
                asset={asset}
                header={<SolanaTokenHeader mint={mint} owner={owner} />}
                refreshing={refreshing}
                pendingCount={pendingCount}
                markAsTimedOut={markAsTimedOut}
            />
        </View>
    );
});

export const SolanaTokenWalletFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { owner, mint } = useParams<SolanaTokenWalletFragmentProps>();

    const isValidAddress = isSolanaAddress(owner);
    const isValidToken = isSolanaAddress(mint);

    if (!isValidAddress || !isValidToken) { // should never happen
        navigation.goBack();
        return null;
    }

    return (
        <View style={[
            styles.fragment,
            Platform.select({ android: { backgroundColor: theme.backgroundPrimary } })
        ]}>
            <Suspense fallback={<SolanaWalletSkeleton />}>
                <SolanaTokenWalletComponent owner={owner} mint={mint} />
            </Suspense>
        </View>
    );
});