import React, { Suspense, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useHoldersAccounts, useTheme } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { useAccountTransactions } from '../../engine/hooks';
import { useClient4 } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { WalletTransactions } from "./views/WalletTransactions";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { TabHeader } from "../../components/topbar/TabHeader";
import { TabView, SceneRendererProps, TabBar } from 'react-native-tab-view';
import { PressableChip } from "../../components/PressableChip";
import { HoldersCardTransactions } from "./views/HoldersCardTransactions";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address } from "@ton/core";
import { TransactionsSkeleton } from "../../components/skeletons/TransactionsSkeleton";
import { HoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { setStatusBarStyle } from "expo-status-bar";
import { ThemeType } from "../../engine/state/theme";
import { PendingTransactions } from "./views/PendingTransactions";

function TransactionsComponent(props: { account: Address, isLedger?: boolean, theme: ThemeType }) {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const address = props.account;
    const theme = props.theme
    const client = useClient4(isTestnet);
    const txs = useAccountTransactions(client, address.toString({ testOnly: isTestnet }));
    const holdersAccounts = useHoldersAccounts(address).data;
    const holdersCards = holdersAccounts?.type === 'private'
        ? ((holdersAccounts?.accounts ?? []) as HoldersAccount[]).map((a) => a.cards).flat()
        : [];
    const transactions = txs.data;

    const [tab, setTab] = useState<{ prev?: number, current: number }>({ current: 0 });

    const hasTxs = useMemo(() => {
        return (holdersCards?.length ?? 0) > 0;
    }, [transactions?.length, holdersCards]);

    const routes = useMemo(() => {
        return [
            { key: 'main', title: t('common.mainWallet') },
            ...(holdersCards ?? []).map((card) => {
                return {
                    key: card.id,
                    title: t('products.holders.card.title', { cardNumber: card.lastFourDigits ?? '' })
                };
            }).filter((x) => !!x) as { key: string; title: string; }[]
        ]
    }, [holdersCards]);

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext) {
            txs.next();
        }
    }, [txs.next, txs.hasNext]);

    return (
        <View style={{ flex: 1, backgroundColor: props.theme.backgroundPrimary }}>
            <TabHeader title={t('transactions.history')} />
            <TabView
                tabBarPosition={'top'}
                renderTabBar={(props) => {
                    if (!hasTxs) {
                        return null;
                    }

                    return (
                        <TabBar
                            {...props}
                            scrollEnabled={true}
                            style={{ backgroundColor: theme.transparent, paddingVertical: 8 }}
                            contentContainerStyle={{ marginLeft: 16 }}
                            indicatorStyle={{ backgroundColor: theme.transparent }}
                            gap={16}
                            tabStyle={{ marginRight: 90 }}
                            renderTabBarItem={(tabItemProps) => {
                                const focused = tabItemProps.route.key === props.navigationState.routes[props.navigationState.index].key;
                                return (
                                    <PressableChip
                                        key={`selector-${tabItemProps.route.key}`}
                                        onPress={tabItemProps.onPress}
                                        style={{ backgroundColor: focused ? theme.accent : theme.border }}
                                        textStyle={{ color: focused ? theme.white : theme.textPrimary, }}
                                        text={tabItemProps.route.title}
                                    />
                                );
                            }}
                        />
                    );
                }}
                onIndexChange={(index: number) => {
                    setTab({ prev: tab.current, current: index });
                }}
                lazy={true}
                renderLazyPlaceholder={() => <TransactionsSkeleton />}
                navigationState={{ index: tab.current, routes }}
                offscreenPageLimit={2}
                renderScene={(sceneProps: SceneRendererProps & { route: { key: string; title: string; } }) => {
                    if (sceneProps.route.key === 'main') {
                        return (
                            <WalletTransactions
                                txs={transactions ?? []}
                                address={address}
                                navigation={navigation}
                                safeArea={safeArea}
                                onLoadMore={onReachedEnd}
                                hasNext={txs.hasNext === true}
                                loading={txs.loading}
                                ledger={props.isLedger}
                                theme={theme}
                                header={<PendingTransactions viewType={'history'} />}
                            />
                        )
                    } else {
                        return (
                            <HoldersCardTransactions
                                key={`card-${sceneProps.route.key}`}
                                id={sceneProps.route.key}
                                address={address}
                                theme={theme}
                                isTestnet={isTestnet}
                            />
                        )
                    }
                }}
            />
        </View>
    );
}

export const TransactionsFragment = fragment(() => {
    const theme = useTheme();
    const route = useRoute();
    const isLedger = route.name === 'LedgerTransactions';
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();

    const account = useMemo(() => {
        if (isLedger) {
            if (!ledgerContext?.addr) {
                return undefined;
            }
            try {
                return Address.parse(ledgerContext.addr.address);
            } catch {

            }
        } else {
            return selected?.address;
        }
    }, [selected, ledgerContext?.addr]);

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    if (!account) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
                <TabHeader title={t('transactions.history')} />
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingIndicator />
                </View>
            </View>
        );
    } else {
        return (
            <Suspense fallback={
                <View style={{ paddingTop: 166 }}>
                    <TransactionsSkeleton />
                </View>
            }>
                <TransactionsComponent
                    theme={theme}
                    isLedger={isLedger}
                    account={account}
                />
            </Suspense>
        )
    }
});