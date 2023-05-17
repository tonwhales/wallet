import * as React from 'react';
import { Alert, Image, LayoutAnimation, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from './views/TransactionView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueComponent } from '../../components/ValueComponent';
import { BlurView } from 'expo-blur';
import { AddressComponent } from '../../components/AddressComponent';
import Animated, { Easing, FadeInUp, FadeOutDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { Address } from 'ton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { ProductsComponent } from './products/ProductsComponent';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Engine, useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useAppConfig } from '../../utils/AppConfigContext';
import { WalletCard } from '../../components/card/WalletCard';
import { useAppStateManager } from '../../engine/AppStateManager';
import { NewAccountCard } from '../../components/card/NewAccountCard';
import { shortAddress } from '../../utils/shortAddress';

const PendingTxs = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    onPress: (tx: string) => void
}) => {
    const { Theme } = useAppConfig();
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
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const account = props.wallet;
    const appStateManager = useAppStateManager();
    const accounts = React.useMemo(() => {
        const cursor = appStateManager.current.selected;
        const wallets = appStateManager.current.addresses.map((a, i) => {
            return {
                id: i,
                address: a.address,
                selected: i === cursor,
            }
        });
        const selected = wallets.splice(cursor);
        return [...selected, ...wallets];
        // return wallets;

    }, [appStateManager.current]);

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
    const cardWidth = window.width - 32;

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
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);

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
                <ScrollView
                    style={{
                        flexGrow: 0,
                        height: cardHeight + 32,
                    }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ height: cardHeight + 32, paddingVertical: 16 }}
                    snapToOffsets={accounts.map((_, i) => i * (cardWidth + 8))}
                    snapToStart={true}
                    snapToEnd={true}
                    snapToAlignment={'center'}
                    decelerationRate={'fast'}
                    alwaysBounceHorizontal={false}
                >
                    {accounts.map((a, i) => {
                        return (
                            <WalletCard
                                index={i}
                                key={a.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                selected={a.selected}
                                total={accounts.length}
                                address={a.address}
                            />
                        );
                    })}
                </ScrollView>

                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    {
                        (!AppConfig.isTestnet && Platform.OS === 'android') && (
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