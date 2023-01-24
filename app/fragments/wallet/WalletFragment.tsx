import * as React from 'react';
import { Image, LayoutAnimation, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from './views/TransactionView';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInUp, FadeOutDown, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { Address } from 'ton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { AppConfig } from '../../AppConfig';
import { t } from '../../i18n/t';
import { ProductsComponent } from './products/ProductsComponent';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { log } from '../../utils/log';
import { Engine, useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from '../../Navigation';
import { WalletAccountCard } from '../../components/WalletAccountCard';
import { WalletActionButton } from '../../components/WalletActionButton';
import BuyIcon from '../../../assets/ic_action_buy.svg';
import ReceiveIcon from '../../../assets/ic_action_receive.svg';
import SendIcon from '../../../assets/ic_action_send.svg';

const PendingTxs = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    onPress: (tx: string) => void
}) => {
    return (
        <>
            <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('wallet.pendingTransactions')}</Text>
            </View>
            {props.txs.map((t, i) => {
                return (
                    <View
                        key={'tx-view' + t}
                        style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }}
                        collapsable={false}
                    >
                        <TransactionView
                            key={'tx-' + t}
                            own={props.address}
                            engine={props.engine}
                            tx={t.id}
                            separator={i < props.txs.length - 1}
                            onPress={props.onPress}
                        />
                    </View>
                )
            })}
        </>
    );
});

function WalletComponent(props: { wallet: WalletState }) {

    // Dependencies
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const syncState = engine.state.use();
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const account = props.wallet;

    //
    // Transactions
    //

    const openTransactionFragment = React.useCallback((transaction: string) => {
        if (transaction) {
            navigation.navigate('Transaction', {
                transaction: transaction
            });
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
                log('Reached end: ' + prev.lt);
                engine.products.main.loadMore(prev.lt, prev.hash);
            }
        }
    }, [account.next ? account.next.lt : null]);

    //
    // Animations
    //

    const window = useWindowDimensions();

    // Animating wallet card
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    const cardOpacity = useSharedValue(1);
    const dividerOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(1);
    const smallCardY = useSharedValue(Math.floor(cardHeight * 0.15));

    const onScroll = useAnimatedScrollHandler((event) => {
        if ((event.contentOffset.y + 28 + 16) >= 0) { // Fully scrolled
            cardOpacity.value = 0;
            dividerOpacity.value = 1;
            titleOpacity.value = 0;
            smallCardY.value = - Math.floor(cardHeight * 0.15 / 2);
        } else { // Visible
            cardOpacity.value = 1;
            dividerOpacity.value = 0;
            titleOpacity.value = 1;
            smallCardY.value = Math.floor(cardHeight * 0.15 / 2);
        }

        // Bottom reached
        if (event.contentSize.height > 0) {
            let bottomOffset = (event.contentSize.height - event.layoutMeasurement.height) - event.contentOffset.y;
            if (bottomOffset < 2000) {
                runOnJS(onReachedEnd)();
            }
        }
    }, [cardHeight, onReachedEnd]);

    const smallTitleStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(dividerOpacity.value, {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
            transform: [
                {
                    translateY: Math.floor(cardHeight * 0.15 / 2),
                },
                {
                    translateY: -Math.floor(cardHeight * 0.15 / 2),
                },
                {
                    translateY: withTiming(smallCardY.value, {
                        duration: 300,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    }),
                },
                {
                    translateY: Math.floor(cardHeight * 0.15 / 2) - Math.floor(window.height * 0.013),
                },
                {
                    translateX: -Math.floor((window.width - 32) * 0.15 / 2),
                },
                {
                    translateX: Math.floor((window.width - 32) * 0.15 / 2)
                }
            ],
        };
    }, [cardHeight, window]);

    const titleOpacityStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(titleOpacity.value, {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        };
    }, []);

    const dividerOpacityStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(dividerOpacity.value, {
                duration: 200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        };
    }, []);

    const linkNavigator = useLinkNavigator();

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };

    const onOpenBuy = React.useCallback(
        () => {
            navigation.navigate('Buy');
        },
        [],
    );

    const openGraph = React.useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);

    const navigateToCurrencySettings = React.useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    React.useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [account.pending.length]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            <Animated.ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: Platform.OS === 'android'
                        ? safeArea.top + 44
                        : undefined,
                }}
                contentInset={{ top: 44 + 16, bottom: 52 }}
                contentOffset={{ y: -(44 + 16 + safeArea.top), x: 0 }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
            >
                {Platform.OS === 'ios' && (<View style={{ height: safeArea.top }} />)}

                {/* Card */}
                <WalletAccountCard account={account} engine={engine} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginHorizontal: 16 }} collapsable={false}>
                    {
                        !AppConfig.isTestnet && (
                            <WalletActionButton
                                action={onOpenBuy}
                                icon={BuyIcon}
                                title={t('wallet.actions.buy')}
                                style={{ marginRight: 16 }}
                            />
                        )
                    }
                    <WalletActionButton
                        action={() => navigation.navigate('Receive')}
                        icon={ReceiveIcon}
                        title={t('wallet.actions.receive')}
                        style={{ marginRight: 16 }}
                    />
                    <WalletActionButton
                        action={() => navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null, callback: null })}
                        icon={SendIcon}
                        title={t('wallet.actions.send')}
                    />
                </View>

                {account.pending.length > 0 && Platform.OS === 'android' && (
                    <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
                        <PendingTxs
                            txs={account.pending}
                            next={account.next}
                            address={address}
                            engine={engine}
                            onPress={openTransactionFragment}
                        />
                    </Animated.View>
                )}

                {account.pending.length > 0 && Platform.OS !== 'android' && (
                    <PendingTxs
                        txs={account.pending}
                        next={account.next}
                        address={address}
                        engine={engine}
                        onPress={openTransactionFragment}
                    />
                )}

                {/* Jettons, Extensions & other products */}
                <ProductsComponent />

                <View style={{ height: 56 + safeArea.bottom }} />
            </Animated.ScrollView>
            {/* iOS Toolbar */}
            {Platform.OS === 'ios' && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: safeArea.top + 44 + 16,
                }}>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />

                    <BlurView style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        paddingTop: safeArea.top + 16,
                        flexDirection: 'row',
                        overflow: 'hidden'
                    }}>
                        <View style={{ width: '100%', height: 44, paddingHorizontal: 20, justifyContent: 'center' }}>
                            <Animated.Text style={[
                                { fontSize: 37, color: Theme.textColor, fontWeight: '700' },
                                { position: 'relative', ...titleOpacityStyle },
                            ]}>
                                {'Tonhub'}
                            </Animated.Text>
                            <Pressable
                                style={{
                                    position: 'absolute',
                                    right: 24,
                                }}
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                            >
                                <Image source={require('../../../assets/ic_qr.png')} style={{ tintColor: Theme.accent }} />
                            </Pressable>
                        </View>
                        <Animated.View
                            style={[
                                {
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'absolute',
                                    bottom: 0, left: 0, right: 0,
                                },
                                { ...smallTitleStyle },
                            ]}
                            collapsable={false}
                        >
                            <Text style={{ fontWeight: '700', fontSize: 17 }}>
                                {'Tonhub'}
                            </Text>
                        </Animated.View>
                    </BlurView>

                    <Animated.View style={[{ position: 'absolute', bottom: 0.5, left: 0, right: 0, }, { ...dividerOpacityStyle }]}>
                        <View style={{
                            height: 0.5,
                            width: '100%',
                            backgroundColor: '#000',
                            opacity: 0.08
                        }} />
                    </Animated.View>
                </View >
            )}
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
                            <Animated.Text style={[
                                { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                { position: 'relative', ...titleOpacityStyle },
                            ]}>
                                Tonhub
                            </Animated.Text>
                            <Pressable
                                style={{
                                    position: 'absolute',
                                    right: 13,
                                }}
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                            >
                                <Image source={require('../../../assets/ic_qr.png')} style={{ tintColor: Theme.accent }} />
                            </Pressable>
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

export const WalletFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return <WalletComponent wallet={account} />
    }
}, true);