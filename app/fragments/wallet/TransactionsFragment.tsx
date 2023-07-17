import React, { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent, ViewStyle, StyleProp, Insets, PointProp } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { HorizontalScrollableSelector } from "../../components/HorizontalScrollableSelector";
import Animated, { FadeIn, FadeInLeft, FadeInRight, FadeOut, FadeOutLeft, FadeOutRight } from "react-native-reanimated";
import { HoldersCardTransactions } from "./views/HoldersCardTransactions";
import { useTrackScreen } from "../../analytics/mixpanel";

const WalletTransactions = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    frameArea: Rect,
    onLoadMore: () => void,
    style?: StyleProp<ViewStyle>,
    contentContainerStyle?: StyleProp<ViewStyle>,
    contentInset?: Insets,
    contentOffset?: PointProp
}) => {
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
    if (props.next) {
        components.push(
            <View
                key="prev-loader"
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
            <View key="footer" style={{ height: 16 }} />
        );
    }

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!event) return;
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        if (!layoutMeasurement || !contentOffset || !contentSize) return;

        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000) {
            props.onLoadMore();
        }
    }, [props.onLoadMore]);

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
            {components}
        </ScrollView>
    );
});

function TransactionsComponent(props: { wallet: WalletState }) {
    const engine = useEngine();
    const holdersCards = engine.products.holders.useCards();
    const holdersStatus = engine.products.holders.useStatus();
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const account = props.wallet;
    const animRef = React.useRef<LottieView>(null);

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
            {holdersCards.length > 0 && holdersStatus.state === 'ok' && (
                <View style={{ paddingVertical: 8 }}>
                    <HorizontalScrollableSelector
                        items={[
                            { title: 'Main wallet' },
                            ...holdersCards.map((account) => {
                                const cards = engine.products.holders.useCardsTransactions(account.id);
                                if (!cards || cards.length === 0) {
                                    return null;
                                }
                                return { title: `Tonhub card${account.card.lastFourDigits ? ' ' + account.card.lastFourDigits : ''}` };
                            }).filter((x) => !!x) as any[]
                        ]}
                        current={tab.current}
                        onSeleted={(index) => {
                            setTab({ prev: tab.current, current: index });
                        }}
                    />
                </View>
            )}
            {account.transactions.length === 0 && tab.current === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                    <Pressable
                        onPress={() => {
                            animRef.current?.play();
                        }}>
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
            )}
            {account.transactions.length > 0 && tab.current === 0 && (
                <Animated.View
                    entering={(tab.prev || 0) < tab.current ? FadeInRight : FadeInLeft}
                    exiting={(tab.prev || 0) < tab.current ? FadeOutRight : FadeOutLeft}
                    style={{ paddingBottom: safeArea.bottom + 56 }}
                >
                    <WalletTransactions
                        txs={account.transactions}
                        next={account.next}
                        address={address}
                        engine={engine}
                        navigation={navigation}
                        safeArea={safeArea}
                        onLoadMore={onReachedEnd}
                        frameArea={frameArea}
                    />
                </Animated.View>
            )}
            {tab.current > 0 && (
                <Animated.View
                    key={`card-notifications-${tab.current}`}
                    entering={(tab.prev || 0) < tab.current ? FadeInRight : FadeInLeft}
                    exiting={(tab.prev || 0) < tab.current ? FadeOutRight : FadeOutLeft}
                    style={{ paddingBottom: safeArea.bottom + 56 }}>
                    <HoldersCardTransactions id={holdersCards[tab.current - 1].id} />
                </Animated.View>
            )}
        </View>
    );
}

export const TransactionsFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    useTrackScreen('History', engine.isTestnet);
    if (!account) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
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