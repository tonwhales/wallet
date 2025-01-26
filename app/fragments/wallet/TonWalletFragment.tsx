import { fragment } from "../../fragment";
import { useAccountLite, useAccountTransactions, useNetwork, useTheme } from "../../engine/hooks";
import { setStatusBarStyle } from "expo-status-bar";
import { Platform, View, StyleSheet, Text } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { Address, toNano } from "@ton/core";
import { Typography } from "../../components/styles";
import { memo, Suspense, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PendingTransactions } from "./views/PendingTransactions";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { PriceComponent } from "../../components/PriceComponent";
import { WalletTransactions } from "./views/WalletTransactions";
import { WalletActions } from "./views/WalletActions";
import { Image } from "expo-image";
import { ValueComponent } from "../../components/ValueComponent";

export type TonWalletFragmentParams = { owner: string }

const TonWalletSkeleton = memo(() => {
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

const TonWalletComponent = memo(({ owner }: TonWalletFragmentParams) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const ownerAddress = Address.parse(owner);
    const route = useRoute();
    const account = useAccountLite(ownerAddress);
    const isLedger = route.name === 'LedgerTonWallet';

    const txs = useAccountTransactions(ownerAddress.toString({ testOnly: isTestnet }), { refetchOnMount: true });
    const transactions = txs.data;

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext) {
            txs.next();
        }
    }, [txs.next, txs.hasNext]);

    const onRefresh = useCallback(() => {
        if (!txs.loading) {
            txs.refresh();
        }
    }, [txs.refresh, txs.loading]);

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
                            {'TON'}
                        </Text>
                        <PriceComponent
                            showSign={false}
                            amount={toNano(1)}
                            style={{ backgroundColor: undefined }}
                            textStyle={[{ color: theme.textSecondary }, styles.headerSubtitle]}
                            theme={theme}
                        />
                    </View>
                )}
            />

            <WalletTransactions
                txs={transactions ?? []}
                address={ownerAddress}
                navigation={navigation}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                hasNext={txs.hasNext === true}
                loading={txs.loading}
                theme={theme}
                ledger={isLedger}
                header={
                    <View style={styles.content}>
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            width: 72, height: 72, borderRadius: 36,
                        }}>
                            <Image
                                source={require('@assets/ic-ton-acc.png')}
                                style={{
                                    borderRadius: 36,
                                    height: 72,
                                    width: 72
                                }}
                            />
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 32, width: 32, borderRadius: 32,
                                position: 'absolute', right: -7, bottom: -7,
                                backgroundColor: theme.surfaceOnBg
                            }}>
                                <Image
                                    source={require('@assets/ic-verified.png')}
                                    style={{ height: 32, width: 32 }}
                                />
                            </View>
                        </View>
                        <View style={{ marginTop: 16, width: '100%' }}>
                            <View style={{ gap: 8, alignItems: 'center' }}>
                                <ValueComponent
                                    value={account?.balance ?? 0n}
                                    precision={2}
                                    fontStyle={[Typography.semiBold32_38, { color: theme.textPrimary }]}
                                    centFontStyle={{ color: theme.textSecondary }}
                                    suffix={' TON'}
                                />
                                <View>
                                    <PriceComponent
                                        showSign={false}
                                        amount={account?.balance ?? 0n}
                                        style={{ backgroundColor: undefined }}
                                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        theme={theme}
                                    />
                                </View>
                            </View>
                            <WalletActions
                                theme={theme}
                                navigation={navigation}
                                isTestnet={isTestnet}
                                isLedger={isLedger}
                                actionAsset={{ type: 'ton' }}
                            />
                            <PendingTransactions
                                viewType={'history'}
                                address={ownerAddress.toString({ testOnly: isTestnet })}
                            />
                        </View>
                    </View>
                }
                refresh={{
                    onRefresh,
                    refreshing: txs.refreshing
                }}
            />
        </View>
    );
})

export const TonWalletFragment = fragment(() => {
    const theme = useTheme();
    const { owner } = useParams<TonWalletFragmentParams>();

    return (
        <View style={[
            styles.fragment,
            Platform.select({ android: { backgroundColor: theme.backgroundPrimary } })
        ]}>
            <Suspense fallback={<TonWalletSkeleton />}>
                <TonWalletComponent owner={owner} />
            </Suspense>
        </View>
    );
});

const styles = StyleSheet.create({
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
    skeletonHeaderTitleComponent: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
    },
    skeletonContent: {
        flexGrow: 1,
        padding: 16,
        alignItems: 'center'
    },
    sekeletonHeaderTitle: {
        height: 28,
        borderRadius: 8,
        width: 64,
        opacity: 0.5
    },
    skeleteonHeaderSubtitle: {
        height: 24,
        borderRadius: 8,
        width: 128,
        opacity: 0.5
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
    },
    jettonIcon: {
        height: 72,
        width: 72,
        borderRadius: 36
    }
});