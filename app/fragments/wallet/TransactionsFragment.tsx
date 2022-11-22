import React, { useEffect, useState } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { Engine, useEngine } from "../../engine/Engine";
import { WalletState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { getCurrentAddress } from "../../storage/appState";
import { BlurView } from 'expo-blur';
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { Address } from "ton";
import { formatDate, getDateKey } from "../../utils/dates";
import { TransactionView } from "./views/TransactionView";
import { FlashList } from "@shopify/flash-list";
import { RoundButton } from "../../components/RoundButton";

const WalletTransactions = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    navigation: TypedNavigation,
    onTxPress: (tx: string) => void,
    safeArea: EdgeInsets,
    frameArea: Rect,
    onLoadMore: () => void,
}) => {
    const animRef = React.useRef<LottieView>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const transactionsSectioned = React.useMemo(() => {
        let res: (string | { id: string, position?: 'first' | 'last' | 'single' })[] = [];
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

        for (let s of sections) {
            res.push(s.title);
            res.push(...s.items.map((id, i) => {
                let position: 'first' | 'last' | 'single' | undefined;
                if (s.items.length === 1) {
                    position = 'single';
                } else {
                    position = i === 0 ? 'first' : i === s.items.length - 1 ? 'last' : undefined;
                }
                return ({ id, position });
            }));
        }
        return res;
    }, [props.txs]);

    useEffect(() => {
        setLoadingMore(false);
    }, [props.txs]);

    return (
        <FlashList
            contentContainerStyle={{
                paddingTop: Platform.OS === 'android'
                    ? props.safeArea.top + 44
                    : undefined,
                paddingHorizontal: 16,
                paddingVertical: 44,
            }}
            contentInset={{ top: 44, bottom: 52 }}
            contentOffset={{ y: -(44 + props.safeArea.top), x: 0 }}
            data={transactionsSectioned}
            renderItem={({ item }) => {
                if (typeof item === "string") {
                    // Rendering title
                    return (
                        <View key={'t-' + item} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                            <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{item}</Text>
                        </View>
                    );
                } else {
                    // Render tx
                    return (
                        <View
                            key={'tx-' + item.id}
                            style={{
                                borderTopRightRadius: (item.position === 'first' || item.position === 'single') ? 14 : undefined,
                                borderTopLeftRadius: (item.position === 'first' || item.position === 'single') ? 14 : undefined,
                                borderBottomLeftRadius: (item.position === 'last' || item.position === 'single') ? 14 : undefined,
                                borderBottomRightRadius: (item.position === 'last' || item.position === 'single') ? 14 : undefined,
                                backgroundColor: Theme.item,
                                overflow: 'hidden'
                            }}
                            collapsable={false}
                        >
                            <TransactionView
                                own={props.address}
                                engine={props.engine}
                                tx={item.id}
                                separator={item.position !== 'last' && item.position !== 'single'}
                                onPress={props.onTxPress}
                            />
                        </View>
                    );
                }
            }}
            getItemType={(item) => {
                // To achieve better performance, specify the type based on the item
                return typeof item === "string" ? "sectionHeader" : "row";
            }}
            estimatedItemSize={62}
            ListEmptyComponent={() => {
                return (
                    <>
                        <View style={{ height: (props.frameArea.height - 192 - (props.safeArea.top + 44) - (52 + props.safeArea.bottom) - 16 - 17) / 2 }} />
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
                                onPress={() => props.navigation.navigate('Receive')}
                            />
                        </View>
                    </>
                );
            }}
            ListFooterComponent={() => {
                if (loadingMore) {
                    return (
                        <View key="prev-loader" style={{ height: 64, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                            <LoadingIndicator simple={true} />
                        </View>
                    );
                }
                if (Platform.OS === 'ios') return null;
                return <View style={{ height: 32 }} />;
            }}
            onEndReached={() => {
                if (props.next) {
                    setLoadingMore(true);
                    props.onLoadMore();
                }
            }}
            onEndReachedThreshold={0.5}
        />
    );
});

function TransactionsComponent(props: { wallet: WalletState }) {
    // Dependencies
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const syncState = engine.state.use();
    const account = props.wallet;

    const openTransactionFragment = React.useCallback((transaction: string) => {
        if (transaction) {
            navigation.navigate('Transaction', { transaction: transaction });
        }
    }, [navigation]);

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
            <WalletTransactions
                txs={account.transactions}
                next={account.next}
                address={address}
                engine={engine}
                onTxPress={openTransactionFragment}
                navigation={navigation}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                frameArea={frameArea}
            />
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