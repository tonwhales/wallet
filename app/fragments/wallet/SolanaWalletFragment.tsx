import { fragment } from "../../fragment";
import { useNetwork, usePrimaryCurrency, useSolanaAccount, useSolanaTransactions, useTheme } from "../../engine/hooks";
import { setStatusBarStyle } from "expo-status-bar";
import { Platform, View, StyleSheet, Text } from "react-native";
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
import { SolanaTransactions } from "./views/SolanaTransactions";
import { SolanaWalletActions } from "./views/SolanaWalletActions";
import { isSolanaAddress } from "../../utils/solana/address";
import { SolanaWalletAddress } from "../../components/address/SolanaWalletAddress";

import SolanaIcon from '@assets/ic-solana.svg';

export type SolanaWalletFragmentProps = {
    owner: string
}

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

const SolanaWalletComponent = memo(({ owner }: SolanaWalletFragmentProps) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const account = useSolanaAccount(owner);
    const txs = useSolanaTransactions(owner);

    const balance = account.data?.balance ?? 0n;
    const symbol = "SOL";
    const decimals = 9;

    const transactions = txs.data ?? [];

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext) {
            txs.next();
        }
    }, [txs.next, txs.hasNext]);

    const onRefresh = useCallback(() => {
        txs.refresh();
    }, [txs.refresh]);

    const [currency] = usePrimaryCurrency();
    // TODO: get rate from API
    const rate = 144;

    // Calculate USD value
    const usdValue = rate ? (Number(balance) / Math.pow(10, decimals)) * Number(rate) : 0;
    const usdValueBigInt = BigInt(Math.round(usdValue * 100)) * 10n ** 7n; // Convert to nano with 9 decimals

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

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
                            {symbol}
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
                address={owner}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                onRefresh={onRefresh}
                loading={false}
                owner={owner}
                header={
                    <View style={styles.content}>
                        <View style={{
                            width: 72, height: 72, borderRadius: 36,
                            borderWidth: 0,
                            backgroundColor: theme.surfaceOnBg,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <SolanaIcon
                                width={48}
                                height={48}
                                style={{
                                    borderRadius: 24,
                                    height: 48,
                                    width: 48
                                }}
                            />
                        </View>
                        <View style={{ marginTop: 16, width: '100%' }}>
                            <View style={{ gap: 8, alignItems: 'center' }}>
                                <SolanaWalletAddress
                                    address={owner}
                                    elipsise={{ start: 4, end: 4 }}
                                    copyOnPress
                                    disableContextMenu
                                    copyToastProps={{ marginBottom: 70 + bottomBarHeight }}
                                />
                                <ValueComponent
                                    value={balance}
                                    decimals={9}
                                    precision={4}
                                    fontStyle={[Typography.semiBold32_38, { color: theme.textPrimary }]}
                                    centFontStyle={{ color: theme.textSecondary }}
                                    suffix={` ${symbol}`}
                                />
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    <ValueComponent
                                        value={usdValueBigInt}
                                        precision={2}
                                        decimals={9}
                                        suffix={` ${CurrencySymbols[currency]?.symbol}`}
                                    />
                                </Text>
                            </View>
                            <SolanaWalletActions
                                style={{ paddingHorizontal: 0 }}
                                theme={theme}
                                navigation={navigation}
                                isTestnet={isTestnet}
                                address={owner}
                            />
                            {/* Placeholder for pending transactions */}
                            <View style={{ marginTop: 16 }} />
                        </View>
                    </View>
                }
            />
        </View>
    );
});

export const SolanaWalletFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { owner } = useParams<SolanaWalletFragmentProps>();

    const isValidAddress = isSolanaAddress(owner);

    if (!isValidAddress) { // should never happen
        navigation.goBack();
        return null;
    }

    return (
        <View style={[
            styles.fragment,
            Platform.select({ android: { backgroundColor: theme.backgroundPrimary } })
        ]}>
            <Suspense fallback={<SolanaWalletSkeleton />}>
                <SolanaWalletComponent owner={owner} />
            </Suspense>
        </View>
    );
});

export const solanaWalletFragmentStyles = StyleSheet.create({
    fragment: {
        flexGrow: 1,
        paddingTop: 32
    },
    container: {
        flexGrow: 1
    },
    content: {
        flexGrow: 1,
        paddingTop: 16,
        alignItems: 'center'
    },
    header: {
        paddingHorizontal: 16,
    },
    headerTitleComponent: {
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '80%'
    },
    headerTitle: {
        ...Typography.semiBold17_24,
        textAlign: 'center'
    },
    headerSubtitle: {
        ...Typography.regular15_20,
        textAlign: 'center'
    },
    skeletonContent: {
        flexGrow: 1,
        padding: 16,
        alignItems: 'center'
    },
    skeletonIcon: {
        height: 72,
        width: 72,
        borderRadius: 36,
        opacity: 0.5
    },
    skeletonBalance: {
        height: 48,
        width: 160,
        borderRadius: 8,
        opacity: 0.5,
        marginTop: 8
    },
    skeletonActions: {
        height: 92,
        width: '100%',
        borderRadius: 20,
        opacity: 0.5,
        marginTop: 28
    }
});

const styles = solanaWalletFragmentStyles;