import React, { memo, useCallback, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useHoldersCards, useTheme } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { useAccountTransactions } from '../../engine/hooks';
import { useClient4 } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { WalletTransactions } from "./views/WalletTransactions";
import { SelectedAccount } from '../../engine/types';
import { useTrackScreen } from "../../analytics/mixpanel";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { TabHeader } from "../../components/topbar/TabHeader";
import { TabView, SceneRendererProps, TabBar } from 'react-native-tab-view';
import { TransactionsEmptyState } from "./views/TransactionsEmptyStateView";
import { PressableChip } from "../../components/PressableChip";
import { HoldersCardTransactions } from "./views/HoldersCardTransactions";
import { PendingTransactions } from "./views/PendingTransactions";

function TransactionsComponent(props: { account: SelectedAccount }) {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const client = useClient4(useNetwork().isTestnet);
    const txs = useAccountTransactions(client, props.account.addressString);
    const holdersCards = useHoldersCards(props.account.address).data;
    const transactions = txs?.data;
    const address = props.account.address;

    const [tab, setTab] = useState<{ prev?: number, current: number }>({ current: 0 });

    const hasTxs = useMemo(() => {
        return transactions?.length !== 0 || (holdersCards?.length ?? 0) > 0;
    }, [transactions?.length, holdersCards]);

    const routes = useMemo(() => {
        return [
            { key: 'main', title: t('common.mainWallet') },
            ...holdersCards?.map((account) => {
                return {
                    key: account.id,
                    title: t('products.holders.card.title', { cardNumber: account.card.lastFourDigits ?? '' })
                };
            }).filter((x) => !!x) as { key: string; title: string; }[]
        ]
    }, [holdersCards]);

    const onReachedEnd = useCallback(() => {
        if (txs?.hasNext) {
            txs?.next();
        }
    }, [txs?.next, txs?.hasNext]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
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
                            contentContainerStyle={{ marginLeft: 8 }}
                            indicatorStyle={{ backgroundColor: theme.transparent }}
                            renderTabBarItem={(tabItemProps) => {
                                const focused = tabItemProps.route.key === props.navigationState.routes[props.navigationState.index].key;
                                return (
                                    <PressableChip
                                        key={`selector-${tabItemProps.route.key}`}
                                        onPress={tabItemProps.onPress}
                                        style={{ backgroundColor: focused ? theme.accent : theme.border, }}
                                        textStyle={{ color: focused ? theme.white : theme.textPrimary, }}
                                        text={tabItemProps.route.title}
                                    />
                                );
                            }}
                        />
                    );
                }}
                onIndexChange={(index: number) => {
                    console.log('index', index);
                    setTab({ prev: tab.current, current: index });
                }}
                lazy={true}
                renderLazyPlaceholder={() => <Text>{'sdkjhfskdjfhs'}</Text>}
                navigationState={{ index: tab.current, routes }}
                offscreenPageLimit={2}
                renderScene={(sceneProps: SceneRendererProps & { route: { key: string; title: string; } }) => {
                    if (sceneProps.route.key === 'main') {
                        return (transactions && transactions.length > 0)
                            ? (
                                <WalletTransactions
                                    txs={transactions}
                                    address={address}
                                    navigation={navigation}
                                    safeArea={safeArea}
                                    onLoadMore={onReachedEnd}
                                    hasNext={txs?.hasNext === true}
                                    frameArea={frameArea}
                                    loading={txs?.loading === true}
                                    header={<PendingTransactions />}
                                />
                            )
                            : (<TransactionsEmptyState />)
                    } else {
                        return (
                            <HoldersCardTransactions
                                key={`card-${sceneProps.route.key}`}
                                id={sceneProps.route.key}
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
    const { isTestnet } = useNetwork();
    const account = useSelectedAccount();

    useTrackScreen('History', isTestnet);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    if (!account) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <StatusBar style={'dark'} />
                <TabHeader title={t('transactions.history')} />
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingIndicator />
                </View>
            </View>
        );
    } else {
        return (
            <TransactionsComponent account={account} />
        )
    }
}, true);