import { fragment } from "../../fragment";
import { usePrimaryCurrency, useSolanaToken, useSolanaTokenTransactions, useTheme } from "../../engine/hooks";
import { setStatusBarStyle } from "expo-status-bar";
import { Platform, View, Text } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { Typography } from "../../components/styles";
import { memo, Suspense, useCallback } from "react";
import { ValueComponent } from "../../components/ValueComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { PendingSolanaTransactions } from "./views/PendingSolanaTransactions";
import { ReceiveableSolanaAsset } from "./ReceiveFragment";

import SolanaIcon from '@assets/ic-solana.svg';

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

    if (!token) {
        return null;
    }

    const balance = token.amount ?? 0n;
    const symbol = token.symbol ?? "?";
    const decimals = token.decimals ?? 6;
    const price = toNano(token.uiAmount ?? 0);
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
                {logoURI ? (
                    <WImage
                        src={logoURI}
                        width={72}
                        height={72}
                        borderRadius={36}
                    />
                ) : (
                    <SolanaIcon
                        width={32}
                        height={32}
                        style={{
                            borderRadius: 16,
                            height: 32,
                            width: 32
                        }}
                    />
                )}
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
                <PendingSolanaTransactions
                    address={owner}
                    viewType="main"
                    filter={(tx) => tx.tx.token?.mint === mint}
                />
                <View style={{ marginTop: 16 }} />
            </View>
        </View>
    );
});

const SolanaTokenWalletComponent = memo(({ owner, mint }: SolanaTokenWalletFragmentProps) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const txs = useSolanaTokenTransactions(owner, mint);
    const token = useSolanaToken(owner, mint);
    const asset: ReceiveableSolanaAsset = {
        mint: mint,
        content: {
            icon: token?.logoURI,
            name: token?.symbol
        }
    }

    const transactions = txs.data ?? [];

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext) {
            txs.next();
        }
    }, [txs.next, txs.hasNext]);

    const onRefresh = useCallback(() => {
        txs.refresh();
        token?.refresh();
    }, [txs.refresh, token?.refresh]);

    const [currency] = usePrimaryCurrency();

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    const rate = 1;

    return (
        <View style={[styles.container, Platform.select({
            android: { paddingBottom: bottomBarHeight + safeArea.top + 56 + 16 },
            ios: { paddingBottom: bottomBarHeight + safeArea.top + 56 }
        })]}>
            <ScreenHeader
                onBackPressed={navigation.goBack}
                style={styles.header}
                titleComponent={(
                    <View style={styles.headerTitleComponent}>
                        <Text
                            style={[{ color: theme.textPrimary }, styles.headerTitle]}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {token?.symbol}
                        </Text>
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
                navigation={navigation}
                txs={transactions}
                hasNext={txs.hasNext}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                onRefresh={onRefresh}
                loading={txs.loading}
                owner={owner}
                asset={asset}
                header={<SolanaTokenHeader mint={mint} owner={owner} />}
                refreshing={txs.refreshing}
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