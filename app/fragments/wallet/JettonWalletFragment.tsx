import { fragment } from "../../fragment";
import { useJetton, useNetwork, usePrimaryCurrency, useTheme } from "../../engine/hooks";
import { setStatusBarStyle } from "expo-status-bar";
import { Platform, View, StyleSheet, Text } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { Address, toNano } from "@ton/core";
import { Typography } from "../../components/styles";
import { memo, Suspense, useCallback } from "react";
import { JettonIcon } from "../../components/products/JettonIcon";
import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletActions } from "./views/WalletActions";
import { JettonWalletTransactions } from "./views/JettonWalletTransactions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJettonTransactions } from "../../engine/hooks/transactions/useJettonTransactions";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { mapJettonToMasterState } from "../../utils/jettons/mapJettonToMasterState";
import { CurrencySymbols } from "../../utils/formatCurrency";
import { calculateSwapAmount } from "../../utils/jettons/calculateSwapAmount";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { PendingTransaction } from "../../engine/state/pending";
import { JettonPendingTransactions } from "./views/JettonPendingTransactions";

export type JettonWalletFragmentProps = {
    owner: string;
    master: string;
    wallet?: string;
    isLedger?: boolean;
}

function validateWalletAddresses(owner: string, master: string, wallet?: string) {
    try {
        Address.parse(owner);
        Address.parse(master);

        if (!wallet) {
            return true;
        }

        Address.parse(wallet);

        return true;
    } catch {
        return false;
    }
}

const JettonWalletSkeleton = memo(() => {
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

const JettonWalletComponent = memo(({ owner, master, wallet, isLedger }: JettonWalletFragmentProps) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const ownerAddress = Address.parse(owner);

    const jetton = useJetton({ owner, master, wallet });
    const txs = useJettonTransactions(owner, master, { refetchOnMount: true });
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
    const rate = jetton?.prices?.[currency];
    const decimals = jetton?.decimals ?? 9;
    const balance = jetton?.balance ?? 0n;
    const swapAmount = rate ? calculateSwapAmount(balance, rate, decimals) : undefined;

    const pendingFilter = useCallback((ptx: PendingTransaction) => {
        if (ptx.body?.type !== 'token') {
            return false;
        }

        return ptx.body.jetton.master.toString({ testOnly: isTestnet }) === master;
    }, [isTestnet]);

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    if (!jetton) {
        return <JettonWalletSkeleton />;
    }

    const masterState: JettonMasterState & { address: string } = mapJettonToMasterState(jetton, isTestnet);

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
                            {jetton?.symbol}
                        </Text>
                        {!!rate && (
                            <Text
                                style={[{ color: theme.textSecondary }, styles.headerSubtitle]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                <ValueComponent
                                    value={toNano(rate)}
                                    precision={2}
                                    suffix={CurrencySymbols[currency]?.symbol}
                                    forcePrecision
                                />
                            </Text>
                        )}
                    </View>
                )}
            />
            <JettonWalletTransactions
                jetton={jetton}
                theme={theme}
                navigation={navigation}
                txs={transactions}
                hasNext={txs.hasNext}
                address={ownerAddress}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                onRefresh={onRefresh}
                loading={false}
                ledger={isLedger}
                header={
                    <View style={styles.content}>
                        <JettonIcon
                            size={72}
                            jetton={masterState}
                            theme={theme}
                            isTestnet={isTestnet}
                            backgroundColor={theme.surfaceOnElevation}
                        />
                        <View style={{ marginTop: 16, width: '100%' }}>
                            <View style={{ gap: 8, alignItems: 'center' }}>
                                <ValueComponent
                                    value={jetton?.balance ?? 0n}
                                    decimals={jetton?.decimals ?? 9}
                                    precision={2}
                                    fontStyle={[Typography.semiBold32_38, { color: theme.textPrimary }]}
                                    centFontStyle={{ color: theme.textSecondary }}
                                    suffix={jetton?.symbol ? ` ${jetton.symbol}` : ''}
                                />
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    <ValueComponent
                                        value={swapAmount ?? 0n}
                                        precision={2}
                                        decimals={decimals}
                                        suffix={` ${CurrencySymbols[currency]?.symbol}`}
                                    />
                                </Text>
                            </View>
                            <WalletActions
                                actionAsset={{
                                    type: 'jetton',
                                    jetton: jetton
                                }}
                                theme={theme}
                                navigation={navigation}
                                isTestnet={isTestnet}
                                isLedger={isLedger}
                            />
                            <JettonPendingTransactions
                                owner={ownerAddress.toString({ testOnly: isTestnet })}
                                master={master}
                                onChange={onRefresh}
                                filter={pendingFilter}
                            />
                        </View>
                    </View>
                }
            />
        </View>
    );
})

export const JettonWalletFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { owner, master, wallet } = useParams<JettonWalletFragmentProps>();
    const route = useRoute();
    const isLedger = route.name === 'LedgerJettonWallet';

    const addresses = validateWalletAddresses(owner, master, wallet);

    if (!addresses) { // should never happen
        navigation.goBack();
        return null;
    }

    return (
        <View style={[
            styles.fragment,
            Platform.select({ android: { backgroundColor: theme.backgroundPrimary } })
        ]}>
            <Suspense fallback={<JettonWalletSkeleton />}>
                <JettonWalletComponent
                    owner={owner}
                    master={master}
                    wallet={wallet}
                    isLedger={isLedger}
                />
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