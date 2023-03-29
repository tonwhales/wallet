import * as React from 'react';
import { Image, LayoutAnimation, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from './views/TransactionView';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { ValueComponent } from '../../components/ValueComponent';
import { BlurView } from 'expo-blur';
import { AddressComponent } from '../../components/AddressComponent';
import Animated, { Easing, FadeInUp, FadeOutDown, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { Address } from 'ton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { AppConfig } from '../../AppConfig';
import { WalletAddress } from '../../components/WalletAddress';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { ProductsComponent } from './products/ProductsComponent';
import { fragment } from '../../fragment';
import BN from 'bn.js';
import CircularProgress from '../../components/CircularProgress/CircularProgress';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { log } from '../../utils/log';
import { Engine, useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from "../../useLinkNavigator";
import { ExchangeRate } from '../../components/ExchangeRate';
import GraphIcon from '../../../assets/ic_graph.svg';

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
                        style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: Theme.item, overflow: 'hidden' }}
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

    //
    // Animations
    //

    const window = useWindowDimensions();

    // Animating wallet card
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    const cardOpacity = useSharedValue(1);
    const smallCardOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(1);
    const smallCardY = useSharedValue(Math.floor(cardHeight * 0.15));

    const onScroll = useAnimatedScrollHandler((event) => {
        if ((event.contentOffset.y + 28 - cardHeight) >= 0) { // Fully scrolled
            cardOpacity.value = 0;
            smallCardOpacity.value = 1;
            titleOpacity.value = 0;
            smallCardY.value = - Math.floor(cardHeight * 0.15 / 2);
        } else { // Visible
            cardOpacity.value = 1;
            smallCardOpacity.value = 0;
            titleOpacity.value = 1;
            smallCardY.value = Math.floor(cardHeight * 0.15 / 2);
        }
    }, [cardHeight]);

    const smallCardStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(smallCardOpacity.value, {
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
                contentInset={{ top: 44, bottom: 52 }}
                contentOffset={{ y: -(44 + safeArea.top), x: 0 }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
            >
                {Platform.OS === 'ios' && (<View style={{ height: safeArea.top }} />)}
                <View
                    style={[
                        {
                            marginHorizontal: 16, marginVertical: 16,
                            height: cardHeight,
                        }
                    ]}
                    collapsable={false}
                >
                    <Image
                        source={require('../../../assets/wallet_card.png')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: cardHeight,
                            width: window.width - 32
                        }}
                        resizeMode="stretch"
                        resizeMethod="resize"
                    />
                    {/* Sync state */}
                    <View style={{
                        flexDirection: 'row',
                        marginTop: 16, marginLeft: 22,
                        alignItems: 'center'
                    }}>
                        {syncState === 'online' && (
                            <View style={{
                                marginRight: 4,
                                height: 8, width: 8,
                                borderRadius: 4,
                                backgroundColor: Theme.success
                            }} />
                        )}
                        {syncState !== 'online' && (
                            <CircularProgress
                                style={{
                                    transform: [{ rotate: '-90deg' }],
                                    marginRight: 4
                                }}
                                progress={100}
                                animateFromValue={0}
                                duration={6000}
                                size={12}
                                width={2}
                                color={'#FFFFFF'}
                                backgroundColor={'#596080'}
                                fullColor={null}
                                loop={true}
                                containerColor={Theme.transparent}
                            />
                        )}
                        <Text style={{
                            fontSize: 14, fontWeight: '400',
                            color: syncState === 'online' ? Theme.success : '#A2A5B2'
                        }}>
                            {t(`syncStatus.${syncState}`)}
                        </Text>
                    </View>

                    <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 16, marginLeft: 22 }}>{t('wallet.balanceTitle')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: (pressed && balanceChart && balanceChart.chart.length > 0) ? 0.3 : 1,
                                    marginLeft: 22,
                                    flexDirection: 'row', alignItems: 'center'
                                };
                            }}
                            onPress={openGraph}
                        >
                            <Text style={{ fontSize: 30, color: 'white', marginRight: 8, fontWeight: '800', height: 40, marginTop: 2 }}>
                                <ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                            </Text>
                            {account?.balance.gt(new BN(0)) && <GraphIcon />}
                        </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 22, marginTop: 6 }}>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.3 : 1,
                                }
                            }}
                            onPress={navigateToCurrencySettings}
                        >
                            <PriceComponent amount={account.balance} />
                        </Pressable>
                        <Pressable style={({ pressed }) => {
                            return {
                                marginLeft: 8,
                                opacity: pressed ? 0.3 : 1
                            }
                        }}
                            onPress={navigateToCurrencySettings}
                        >
                            <ExchangeRate />
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    <WalletAddress
                        value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        address={address}
                        elipsise
                        style={{
                            marginLeft: 22,
                            marginBottom: 24,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            textAlign: 'left',
                            color: 'white',
                            fontWeight: '500',
                            fontFamily: undefined
                        }}
                        lockActions
                    />
                </View>

                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    {
                        !AppConfig.isTestnet && (
                            <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: Theme.item, borderRadius: 14 }}>
                                <TouchableHighlight onPress={onOpenBuy} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                                    <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                        <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../../../assets/ic_buy.png')} />
                                        </View>
                                        <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('wallet.actions.buy')}</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                        )
                    }
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: Theme.item, borderRadius: 14 }}>
                        <TouchableHighlight onPress={() => navigation.navigate('Receive')} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: Theme.item, borderRadius: 14 }}>
                        <TouchableHighlight onPress={() => navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null, callback: null })} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
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
                                <Animated.Text style={[
                                    { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                    { position: 'relative', ...titleOpacityStyle },
                                ]}>
                                    Tonhub
                                </Animated.Text>
                                <Animated.View
                                    style={[
                                        {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            position: 'absolute',
                                            top: 0, bottom: 0
                                        },
                                        { ...smallCardStyle },
                                    ]}
                                    collapsable={false}
                                >
                                    <View style={{
                                        height: cardHeight,
                                        width: window.width - 32,
                                        flex: 1,
                                        transform: [{ scale: 0.15 }],
                                    }}>
                                        <Image
                                            source={require('../../../assets/wallet_card.png')}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                height: cardHeight,
                                                width: window.width - 32
                                            }}
                                            resizeMode="stretch"
                                            resizeMethod="resize"
                                        />

                                        <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('wallet.balanceTitle')}</Text>
                                        <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}><ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} /></Text>
                                        <View style={{ flexGrow: 1 }}>

                                        </View>
                                        <Text style={{ color: 'white', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                            <AddressComponent address={address} />
                                        </Text>
                                    </View>
                                </Animated.View>
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
                        </BlurView>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: Theme.headerDivider,
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
                            <Animated.Text style={[
                                { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                { position: 'relative', ...titleOpacityStyle },
                            ]}>
                                Tonhub
                            </Animated.Text>
                            <Animated.View
                                style={[
                                    {
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'absolute',
                                        top: 0, bottom: 0
                                    },
                                    { ...smallCardStyle },
                                ]}
                                collapsable={false}
                            >
                                <View style={{
                                    height: cardHeight,
                                    width: window.width - 32,
                                    flex: 1,
                                    transform: [{ scale: 0.15 }],
                                }}>
                                    <Image
                                        source={require('../../../assets/wallet_card.png')}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            height: cardHeight,
                                            width: window.width - 32
                                        }}
                                        resizeMode="stretch"
                                        resizeMethod="resize"
                                    />

                                    <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('wallet.balanceTitle')}</Text>
                                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}><ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} /></Text>
                                    <View style={{ flexGrow: 1 }}>

                                    </View>
                                    <Text style={{ color: 'white', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                        <AddressComponent address={address} />
                                    </Text>
                                </View>
                            </Animated.View>
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
                            backgroundColor: Theme.headerDivider,
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