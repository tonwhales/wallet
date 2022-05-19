import * as React from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from './views/TransactionView';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { ValueComponent } from '../../components/ValueComponent';
import { formatDate, getDateKey } from '../../utils/dates';
import { BlurView } from 'expo-blur';
import { AddressComponent } from '../../components/AddressComponent';
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { Engine, useEngine } from '../../engine/Engine';
import { Transaction } from '../../engine/Transaction';
import { Address } from 'ton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { AppConfig } from '../../AppConfig';
import { WalletAddress } from '../../components/WalletAddress';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { storage } from '../../storage/storage';
import { skipLegalNeocrypto } from '../integrations/NeocryptoFragment';
import { ProductsComponent } from './products/ProductsComponent';
import { fragment } from '../../fragment';
import { openWithInApp } from '../../utils/openWithInApp';
import BN from 'bn.js';
import CircularProgress from '../../components/CircularProgress/CircularProgress';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { WalletState } from '../../engine/products/WalletProduct';

const WalletTransactions = React.memo((props: { txs: Transaction[], address: Address, engine: Engine, onPress: (tx: Transaction) => void }) => {
    const transactionsSectioned = React.useMemo(() => {
        let sections: { title: string, items: Transaction[] }[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].time);
            let lastSection: Transaction[] = [];
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
                lastSection.push(t);
            }
        }
        return sections;
    }, [props.txs]);

    const components: any[] = [];
    for (let s of transactionsSectioned) {
        components.push(
            <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
            </View>
        );
        components.push(
            < View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }
            } collapsable={false} >
                {s.items.map((t, i) => <TransactionView own={props.address} engine={props.engine} tx={t} separator={i < s.items.length - 1} key={'tx-' + t.id} onPress={props.onPress} />)}
            </View >
        );
    }

    // Last
    if (props.txs.length > 0) {
        if (props.txs[props.txs.length - 1].prev) {
            components.push(
                <View key="prev-loader" style={{ height: 64, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                    <LoadingIndicator simple={true} />
                </View>
            );
        } else {
            components.push(
                <View key="footer" style={{ height: 64 }} />
            );
        }
    }

    return <>{components}</>;
});

function WalletComponent(props: { wallet: WalletState }) {

    // Dependencies
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const syncState = engine.state.use();
    const account = props.wallet;

    //
    // Transactions
    //

    const transactions = React.useMemo<Transaction[]>(() => {
        let txs = account.transactions.map((v) => engine.transactions.getWalletTransaction(address, v));
        return [...account.pending, ...txs];
    }, [account.transactions, account.pending]);

    const openTransactionFragment = React.useCallback((transaction: Transaction | null) => {
        if (transaction) {
            navigation.navigate('Transaction', {
                transaction: {
                    ...transaction
                }
            });
        }
    }, [navigation]);

    const onReachedEnd = React.useMemo(() => {
        let prev = transactions.length > 0 ? transactions[transactions.length - 1].prev : null;
        let called = false;
        return () => {
            if (called) {
                return;
            }
            called = true;
            if (prev) {
                console.warn('Reached end: ' + prev);
                engine.products.main.loadMore(prev.lt, prev.hash);
            }
        }
    }, [transactions.length > 0 ? transactions[transactions.length - 1].prev : null]);

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

        // Bottom reached
        let bottomOffset = (event.contentSize.height - event.layoutMeasurement.height) - event.contentOffset.y;
        if (bottomOffset < 300) {
            runOnJS(onReachedEnd)();
        }
    }, [cardHeight, onReachedEnd]);

    const cardOpacityStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(cardOpacity.value, {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        };
    }, []);

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

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src);
            if (res && res.type === 'transaction') {
                // if QR is valid navigate to transfer fragment

                if (!res.payload) {
                    navigation.navigateSimpleTransfer({
                        target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                        comment: res.comment,
                        amount: res.amount,
                        stateInit: res.stateInit,
                        job: null,
                        jetton: null
                    });
                } else {
                    navigation.navigateTransfer({
                        order: {
                            target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                            amount: res.amount || new BN(0),
                            amountAll: false,
                            stateInit: res.stateInit,
                            payload: res.payload,
                        },
                        text: res.comment,
                        job: null
                    });
                }
            }
            if (res && res.type === 'connect') {
                // if QR is valid navigate to sign fragment
                navigation.navigate('Authenticate', {
                    session: res.session,
                    endpoint: res.endpoint
                });
            }

        } catch (error) {
            // Ignore
        }
    };

    const onOpenBuy = React.useCallback(
        () => {
            if (storage.getBoolean(skipLegalNeocrypto)) {
                // storage.set(skipLegalNeocrypto, false);
                const queryParams = new URLSearchParams({
                    partner: 'tonhub',
                    address: address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    cur_from: 'USD',
                    cur_to: 'TON',
                    fix_cur_to: 'true',
                    fix_address: 'true',
                });

                const main = `https://neocrypto.net/buywhite.html?${queryParams.toString()}`;

                openWithInApp(main);
            } else {
                navigation.navigate('Buy')
            }
        },
        [],
    );

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
            >
                {Platform.OS === 'ios' && (<View style={{ height: safeArea.top }} />)}
                <Animated.View
                    style={[
                        { ...cardOpacityStyle },
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
                                containerColor={'transparent'}
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
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                        <ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                    </Text>
                    <PriceComponent amount={account.balance} style={{ marginHorizontal: 22, marginTop: 6 }} />
                    <View style={{ flexGrow: 1 }} />
                    <WalletAddress
                        value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        address={
                            address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(0, 10)
                            + '...'
                            + address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(t.length - 6)
                        }
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
                    />
                </Animated.View>

                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    {/* {
                        !AppConfig.isTestnet && (
                            <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                                <TouchableHighlight onPress={onOpenBuy} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                                    <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                        <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../../../assets/ic_buy.png')} />
                                        </View>
                                        <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{'Buy'}</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                        )
                    } */}
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight onPress={() => navigation.navigate('Receive')} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight onPress={() => navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null })} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>

                <ProductsComponent />

                {
                    transactions.length === 0 && (
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
                    )
                }
                {
                    transactions.length > 0 && (
                        <WalletTransactions
                            txs={transactions}
                            address={address}
                            engine={engine}
                            onPress={openTransactionFragment}
                        />
                    )
                }
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
        return <LoadingIndicator />
    } else {
        return <WalletComponent wallet={account} />
    }
});