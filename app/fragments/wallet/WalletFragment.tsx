import * as React from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { fragment } from "../../fragment";
import { getAppState } from '../../storage/appState';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from '../../components/TransactionView';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { ValueComponent } from '../../components/ValueComponent';
import { useTranslation } from "react-i18next";
import { formatDate, getDateKey } from '../../utils/dates';
import { BlurView } from 'expo-blur';
import { AddressComponent } from '../../components/AddressComponent';
import { registerForPushNotificationsAsync, registerPushToken } from '../../utils/registerPushNotifications';
import { backoff } from '../../utils/time';
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { useAccount } from '../../sync/Engine';
import { Transaction } from '../../sync/Transaction';
import { Address } from 'ton';

const WalletTransactions = React.memo((props: { txs: Transaction[], address: Address, onPress: (tx: Transaction) => void }) => {
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
                    title = formatDate(props.txs[0].time);
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
                <Text style={{ fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
            </View>
        );
        components.push(
            < View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }
            } collapsable={false} >
                {s.items.map((t, i) => <TransactionView own={props.address} tx={t} separator={i < s.items.length - 1} key={'tx-' + t.lt.toString()} onPress={props.onPress} />)}
            </View >
        );
    }

    return <>{components}</>;
})

export const WalletFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [account, engine] = useAccount();
    const transactions = React.useMemo<Transaction[]>(() => {
        return account.transactions.map((v) => engine.getTransaction(v))
    }, [account.transactions]);

    const openTransactionFragment = React.useCallback(
        (transaction: Transaction | null) => {
            if (transaction) {
                navigation.navigate('Transaction', {
                    transaction: {
                        ...transaction
                    }
                });
            }
        },
        [navigation],
    );

    const window = useWindowDimensions();

    // Register token
    React.useEffect(() => {
        (async () => {
            const token = await backoff(() => registerForPushNotificationsAsync());
            if (token) {
                await backoff(() => registerPushToken(token, address));
            }
        })();
    }, []);

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
            if (res) {
                // if QR is valid navigate to transfer fragment
                navigation.navigate('Transfer', {
                    target: res.address.toFriendly(),
                    comment: res.comment,
                    amount: res.amount,
                    payload: res.payload,
                    stateInit: res.stateInit
                })
            }

        } catch (error) {
            // Ignore
        }
    };

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

                    <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('Toncoin balance')}</Text>
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                        <ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                    </Text>
                    {/* TODO: add value in USD */}
                    {/* <View style={{
                        backgroundColor: Theme.accent,
                        borderRadius: 9,
                        height: 24,
                        marginHorizontal: 22, marginTop: 6,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        alignSelf: 'flex-start',
                        paddingVertical: 4, paddingHorizontal: 8
                    }}>
                        <Text style={{
                            color: 'white',
                            fontSize: 14, fontWeight: '600',
                            textAlign: "center",
                            lineHeight: 16
                        }}>
                            {`$ ${(parseFloat(fromNano(account.balance)) * 3.2).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`}
                        </Text>
                    </View> */}
                    <View style={{ flexGrow: 1 }} />
                    <Text style={{ color: 'white', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                        <AddressComponent address={address} />
                    </Text>
                </Animated.View>

                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    <Pressable
                        style={(p) => ({ flexGrow: 1, flexBasis: 0, marginRight: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                        onPress={() => navigation.navigate('Receive')}
                    // onPress={openReceiveModal}
                    >
                        <Image source={require('../../../assets/receive.png')} />
                        <Text style={{ fontSize: 13, color: '#1C8FE3', marginTop: 4 }}>{t("receive")}</Text>
                    </Pressable>
                    <Pressable
                        style={(p) => ({ flexGrow: 1, flexBasis: 0, marginLeft: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                        onPress={() => navigation.navigate('Transfer')}
                    >
                        <Image source={require('../../../assets/send.png')} />
                        <Text style={{ fontSize: 13, color: '#1C8FE3', marginTop: 4 }}>{t("send")}</Text>
                    </Pressable>
                </View>

                {
                    transactions.length === 0 && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: window.height * 0.095 }}>
                            <LottieView
                                source={require('../../../assets/animations/duck.json')}
                                autoPlay={true}
                                loop={false}
                                progress={0.2}
                                style={{ width: window.height * 0.15, height: window.height * 0.15, marginBottom: window.height * 0.1 * 0.3 }}
                            />
                            <Text style={{ fontSize: 16, marginBottom: window.height * 0.1 * 0.3, color: '#7D858A' }}>
                                {t('You have no transactions')}
                            </Text>
                            <RoundButton
                                title={t("Receive TONCOIN")}
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
                            onPress={openTransactionFragment}
                        />
                    )
                }
                {transactions.length > 0 && <View style={{ height: 56 }} />}
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

                                        <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('Toncoin balance')}</Text>
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
                                    <Image source={require('../../../assets/ic_qr.png')} />
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

                                    <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('Toncoin balance')}</Text>
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
                                <Image source={require('../../../assets/ic_qr.png')} />
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
});