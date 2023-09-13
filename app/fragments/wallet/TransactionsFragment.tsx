import React, { useCallback } from "react";
import { Platform, View, Text, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent, SectionList, Dimensions, useWindowDimensions } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from 'expo-blur';
import { t } from "../../i18n/t";
import { Address, RawTransaction } from "ton";
import { formatDate, getDateKey } from "../../utils/dates";
import { RoundButton } from "../../components/RoundButton";
import LottieView from "lottie-react-native";
import { useTheme } from '../../engine/hooks/useTheme';
import { useSelectedAccount } from '../../engine/hooks/useSelectedAccount';
import { TransactionDescription, useAccountTransactions } from '../../engine/hooks/useAccountTransactions';
import { useClient4 } from '../../engine/hooks/useClient4';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { TransactionView } from './views/TransactionView';
import { FlashList } from "@shopify/flash-list";

const WalletTransactions = React.memo((props: {
    txs: TransactionDescription[],
    hasNext: boolean,
    address: Address,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    frameArea: Rect,
    onLoadMore: () => void,
}) => {
    const theme = useTheme();
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;
    
    const transactionsSectioned = React.useMemo(() => {
        let sectioned: ({ type: 'section', title: string } | { type: 'tx', data: TransactionDescription })[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].base.time);
            let title = formatDate(props.txs[0].base.time);
            sectioned.push({ type: 'section', title });
            for (let t of props.txs) {
                let time = getDateKey(t.base.time);
                if (lastTime !== time) {
                    lastTime = time;
                    title = formatDate(t.base.time);
                    sectioned.push({ type: 'section', title });
                }
                sectioned.push({ type: 'tx', data: t });
            }
        }
        return sectioned;
    }, [props.txs]);


    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // if (!event) return;
        // const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        // if (!layoutMeasurement || !contentOffset || !contentSize) return;

        // if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000) {
        //     props.onLoadMore();
        // }
    }, [props.onLoadMore]);

    return (
        <FlashList
            contentContainerStyle={{
                paddingTop: Platform.OS === 'android'
                    ? props.safeArea.top + 44
                    : undefined,
            }}
            data={transactionsSectioned}
            contentInset={{ top: 44, bottom: 52 }}
            contentOffset={{ y: -(44 + props.safeArea.top), x: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            ListHeaderComponent={Platform.OS === 'ios' ? (<View style={{ height: props.safeArea.top }} />) : undefined}
            ListFooterComponent={(Platform.OS !== 'ios' && props.hasNext) ? (<View style={{ height: 64 }} />) : undefined}
            drawDistance={1200}
            estimatedItemSize={62}
            estimatedListSize={{
                height: Dimensions.get('window').height,
                width: Dimensions.get('window').width,
            }}
            getItemType={(item) => item.type}
            renderItem={({ item, index }) => {
                if (item.type === 'section') {
                    return (
                        <View
                            style={{ backgroundColor: theme.background, minHeight: 62, maxHeight: 62, justifyContent: 'flex-end', paddingBottom: 4 }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginHorizontal: 16,
                                    marginVertical: 8
                                }}
                            >
                                {item.title}
                            </Text>
                        </View>
                    );
                }

                return (
                    <TransactionView
                        own={props.address}
                        tx={item.data}
                        separator={transactionsSectioned[index + 1]?.type !== 'section'}
                        key={'tx-' + item.data.id}
                        onPress={() => { }}
                        theme={theme}
                        fontScaleNormal={fontScaleNormal}
                    />
                )
            }}
            onEndReached={() => props.onLoadMore()}
            keyExtractor={(item, index) => item.type === 'section' ? 'section-' + item.title : 'tx-' + item.data.id}
        />
    );
});

function TransactionsComponent(props: { address: Address, transactions: TransactionDescription[], loadMore: () => void, }) {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const { transactions, address } = props;

    const onReachedEnd = React.useCallback(() => {
        props.loadMore();
    }, []);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            {transactions.length === 0 && (
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
                    <Text style={{ fontSize: 16, color: theme.label }}>
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
            {transactions.length > 0 && (
                <WalletTransactions
                    txs={transactions}
                    address={address}
                    navigation={navigation}
                    safeArea={safeArea}
                    onLoadMore={onReachedEnd}
                    hasNext={true} // TODO: fix
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
                        <View style={{ backgroundColor: theme.background, opacity: 0.9, flexGrow: 1 }} />
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
                                        color: theme.textColor,
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
                            backgroundColor: theme.headerDivider,
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
                        backgroundColor: theme.background,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Text style={[
                                {
                                    fontSize: 22,
                                    color: theme.textColor,
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
                            backgroundColor: theme.headerDivider,
                            opacity: 0.08
                        }} />
                    </View>
                )
            }
        </View >
    );
}

export const TransactionsFragment = fragment(() => {
    const account = useSelectedAccount();
    const client = useClient4(useNetwork().isTestnet);
    const transactions = useAccountTransactions(client, account.addressString);

    if (!transactions) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return <TransactionsComponent address={account.address} transactions={transactions.data} loadMore={transactions.next} />
    }
}, true);