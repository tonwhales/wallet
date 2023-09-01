import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent, ViewStyle, StyleProp, Insets, PointProp } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { Engine, useEngine } from "../../engine/Engine";
import { WalletState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { getCurrentAddress } from "../../storage/appState";
import { t } from "../../i18n/t";
import { Address } from "ton";
import { formatDate, getDateKey } from "../../utils/dates";
import { TransactionsSection } from "./views/TransactionsSection";
import { RoundButton } from "../../components/RoundButton";
import LottieView from "lottie-react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { TabHeader } from "../../components/topbar/TabHeader";
import { HoldersCardTransactions } from "./views/HoldersCardTransactions";
import { useTrackScreen } from "../../analytics/mixpanel";
import { TabView, SceneRendererProps, TabBar } from 'react-native-tab-view';
import { PressableChip } from "../../PressableChip";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { RequestsView } from "./views/RequestsView";
import { useFocusEffect } from "@react-navigation/native";

const WalletTransactions = memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    onLoadMore: () => void,
    style?: StyleProp<ViewStyle>,
    contentContainerStyle?: StyleProp<ViewStyle>,
    contentInset?: Insets,
    contentOffset?: PointProp
}) => {
    const [loading, setLoading] = useState(false);

    const transactionsSectioned = React.useMemo(() => {
        let sections: { title: string, items: string[] }[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].time);
            let lastSection: string[] = [];
            let title = formatDate(props.txs[0].time);
            sections.push({ title, items: lastSection });
            for (let t of props.txs) {
                let time = getDateKey(t.time);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(t.time);
                    sections.push({ title, items: lastSection });
                }
                lastSection.push(t.id);
            }
        }
        return sections;
    }, [props.txs]);

    const components: any[] = [];
    for (let s of transactionsSectioned) {
        components.push(
            <TransactionsSection
                key={s.title}
                section={s}
                address={props.address}
                engine={props.engine}
                navigation={props.navigation}
            />
        );
    }

    // Last
    if (loading) {
        components.push(
            <View
                key={'prev-loader'}
                style={{
                    height: 64,
                    alignSelf: 'stretch',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <LoadingIndicator simple={true} />
            </View>
        );
    } else {
        components.push(
            <View key={'footer'} style={{ height: 16 }} />
        );
    }

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!event) return;
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        if (!layoutMeasurement || !contentOffset || !contentSize) return;

        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000) {
            props.onLoadMore();
            setLoading(true);
        }
    }, [props.onLoadMore]);

    useEffect(() => {
        setLoading(false);
    }, [props.txs]);

    return (
        <ScrollView
            style={props.style}
            contentContainerStyle={props.contentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            contentInset={props.contentInset}
            contentOffset={props.contentOffset}
        >
            <RequestsView />
            {components}
        </ScrollView>
    );
});

function TransactionsComponent(props: { wallet: WalletState }) {
    const engine = useEngine();
    const holdersCards = engine.products.holders.useCards();
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = useMemo(() => getCurrentAddress().address, []);
    const account = props.wallet;
    const animRef = useRef<LottieView>(null);

    const hasTxs = useMemo(() => {
        return account.transactions.length !== 0;
    }, [account.transactions.length]);

    const hasCardsNotifications = useMemo(() => {
        return holdersCards.some((account) => {
            const cards = engine.products.holders.getCardTransactions(account.id);
            return cards && cards.length > 0;
        })
    }, [holdersCards]);

    const routes = useMemo(() => {
        return [
            { key: 'main', title: t('common.mainWallet') },
            ...holdersCards.map((account) => {
                const cards = engine.products.holders.getCardTransactions(account.id) ?? [];

                if (cards.length === 0) return null;

                return {
                    key: account.id,
                    title: t('products.zenPay.card.title', { cardNumber: account.card.lastFourDigits ?? '' })
                };
            }).filter((x) => !!x) as { key: string; title: string; }[]
        ]
    }, [holdersCards]);

    const [tab, setTab] = useState<{ prev?: number, current: number }>({ current: 0 });

    const onReachedEnd = React.useMemo(() => {
        let prev = account.next;
        let called = false;
        return () => {
            if (called) {
                return;
            }
            called = true;
            if (prev) {
                engine.products.main.loadMore(prev.lt, prev.hash);
            }
        }
    }, [account.next ? account.next.lt : null]);

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <TabHeader title={t('transactions.history')} />
            <TabView
                tabBarPosition={'top'}
                renderTabBar={(props) => {
                    if (!hasTxs || !hasCardsNotifications) {
                        return null;
                    }

                    return (
                        <TabBar
                            {...props}
                            scrollEnabled={true}
                            style={{ backgroundColor: Theme.transparent, paddingVertical: 8 }}
                            contentContainerStyle={{ marginLeft: 8 }}
                            indicatorStyle={{ backgroundColor: Theme.transparent }}
                            renderTabBarItem={(tabItemProps) => {
                                const focused = tabItemProps.route.key === props.navigationState.routes[props.navigationState.index].key;
                                return (
                                    <PressableChip
                                        key={`selector-item-${tabItemProps.route.key}`}
                                        onPress={tabItemProps.onPress}
                                        style={{ backgroundColor: focused ? Theme.accent : Theme.lightGrey, }}
                                        textStyle={{ color: focused ? Theme.white : Theme.textColor, }}
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
                navigationState={{ index: tab.current, routes }}
                offscreenPageLimit={1}
                renderScene={(sceneProps: SceneRendererProps & { route: { key: string; title: string; } }) => {
                    if (sceneProps.route.key === 'main') {
                        return hasTxs
                            ? (
                                <WalletTransactions
                                    txs={account.transactions}
                                    next={account.next}
                                    address={address}
                                    engine={engine}
                                    navigation={navigation}
                                    safeArea={safeArea}
                                    onLoadMore={onReachedEnd}
                                />
                            )
                            : (
                                <View>
                                    <RequestsView />
                                    <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                                        <Pressable onPress={() => animRef.current?.play()}>
                                            <LottieView
                                                ref={animRef}
                                                source={require('../../../assets/animations/duck.json')}
                                                autoPlay={true}
                                                loop={false}
                                                progress={0.2}
                                                style={{ width: 192, height: 192 }}
                                            />
                                        </Pressable>
                                        <Text style={{ fontSize: 16, color: Theme.label }}>
                                            {t('wallet.empty.message')}
                                        </Text>
                                        <RoundButton
                                            title={t('wallet.empty.receive')}
                                            size="normal"
                                            display="text"
                                            onPress={() => navigation.navigate('Receive')}
                                        />
                                    </View>
                                </View>
                            )
                    } else {
                        return <HoldersCardTransactions id={sceneProps.route.key} />
                    }
                }}
            />
        </View>
    );
}

export const TransactionsFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    useTrackScreen('History', engine.isTestnet);
    useFocusEffect(() => setStatusBarStyle('dark'));
    if (!account) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <StatusBar style={'dark'} />
                <TabHeader title={t('transactions.history')} />
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingIndicator />
                </View>
            </View>
        );
    } else {
        return (<TransactionsComponent wallet={account} />);
    }
}, true);