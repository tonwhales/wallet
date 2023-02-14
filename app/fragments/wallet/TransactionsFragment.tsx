import React, { useCallback } from "react";
import { Platform, View, Text, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { Engine, useEngine } from "../../engine/Engine";
import { WalletState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { getCurrentAddress } from "../../storage/appState";
import { BlurView } from 'expo-blur';
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { Address } from "ton";
import { formatDate, getDateKey } from "../../utils/dates";
import { TransactionsSection } from "./views/TransactionsSection";
import { RoundButton } from "../../components/RoundButton";
import LottieView from "lottie-react-native";

const WalletTransactions = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    frameArea: Rect,
    onLoadMore: () => void,
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
            <View key="footer" style={{ height: 64 }} />
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
            contentContainerStyle={{
                flexGrow: 1,
                paddingTop: Platform.OS === 'android'
                    ? props.safeArea.top + 44
                    : undefined,
            }}
            contentInset={{ top: 44, bottom: 52 }}
            contentOffset={{ y: -(44 + props.safeArea.top), x: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
        >
            {Platform.OS === 'ios' && (<View style={{ height: props.safeArea.top }} />)}
            {components}
            {props.next && (<View style={{ height: 64 }} />)}
        </ScrollView>
    );
});

function TransactionsComponent(props: { wallet: WalletState }) {
    // Dependencies
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const account = props.wallet;
    const animRef = React.useRef<LottieView>(null);

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
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            {account.transactions.length === 0 && (
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
                    <Text style={{ fontSize: 16, color: '#7D858A' }}>
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
            {account.transactions.length > 0 && (
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
            )}
            {/* iOS Toolbar */}
            {
                Platform.OS === 'ios' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                    }}>
                        <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                        <BlurView style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            paddingTop: safeArea.top,
                            flexDirection: 'row',
                            overflow: 'hidden'
                        }}
                        >
                            <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[
                                    {
                                        fontSize: 22,
                                        color: Theme.textColor,
                                        fontWeight: '700',
                                        position: 'relative'
                                    }
                                ]}>
                                    {t('transactions.history')}
                                </Text>
                            </View>
                        </BlurView>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: '#000',
                            opacity: 0.08
                        }} />
                    </View >
                )
            }
            {/* Android Toolbar */}
            {
                Platform.OS === 'android' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                        backgroundColor: Theme.background,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Text style={[
                                {
                                    fontSize: 22,
                                    color: Theme.textColor,
                                    fontWeight: '700',
                                    position: 'relative'
                                },
                            ]}>
                                {t('transactions.history')}
                            </Text>
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: '#000',
                            opacity: 0.08
                        }} />
                    </View>
                )
            }
        </View >
    );
}

export const TransactionsFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return <TransactionsComponent wallet={account} />
    }
}, true);