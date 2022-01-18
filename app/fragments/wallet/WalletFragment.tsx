import * as React from 'react';
import { ActivityIndicator, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Cell, parseTransaction, RawTransaction } from 'ton';
import { fragment } from "../../fragment";
import { getAppState } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from '../../components/TransactionView';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Modalize } from 'react-native-modalize';
import { WalletReceiveComponent } from './WalletReceiveComponent';
import { Portal } from 'react-native-portalize';
import { ValueComponent } from '../../components/ValueComponent';
import { TransactionPreview } from './TransactionPreview';
import { useAccount } from '../../sync/useAccount';
import { useTranslation } from "react-i18next";
import { formatDate } from '../../utils/formatDate';
import { BlurView } from 'expo-blur';
import { showModal } from '../../components/FastModal/showModal';
import { AddressComponent } from '../../components/AddressComponent';
import { registerForPushNotificationsAsync, registerPushToken } from '../../utils/registerPushNotifications';
import { backoff } from '../../utils/time';
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';

function padLt(src: string) {
    let res = src;
    while (res.length < 20) {
        res = '0' + res;
    }
    return res;
}

const modalConfig = {
    containerStyle: {
        margin: 0,
        marginBottom: 0,
        padding: 0,
        borderBottomEndRadius: Platform.OS === 'android' ? 0 : undefined,
        borderBottomStartRadius: Platform.OS === 'android' ? 0 : undefined,
    },
    backgroundStyle: {
        marginBottom: 0,
        padding: 0,
        paddingBottom: 0,
    },
    disableBottomSafeArea: true
}

export const WalletFragment = fragment(() => {
    const { t } = useTranslation();
    const receiveRef = React.useRef<Modalize>(null);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const account = useAccount(address);
    const transactions = React.useMemo<RawTransaction[]>(() => {
        if (account) {
            return account.transactions.map((v) => parseTransaction(0, Cell.fromBoc(Buffer.from(storage.getString('tx_' + address.toFriendly() + '_' + padLt(v))!, 'base64'))[0].beginParse()));
        } else {
            return [];
        }
    }, [account]);
    const transactionsSectioned = React.useMemo(() => {
        let sections: { title: string, items: RawTransaction[] }[] = [];
        if (transactions.length > 0) {
            let lastTime: number = Math.floor(transactions[0].time / (60 * 60 * 24)) * (60 * 60 * 24);
            let lastSection: RawTransaction[] = [];
            let title = formatDate(lastTime);
            sections.push({ title, items: lastSection });
            for (let t of transactions) {
                let time = Math.floor(t.time / (60 * 60 * 24)) * (60 * 60 * 24);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(lastTime);
                    sections.push({ title, items: lastSection });
                }
                lastSection.push(t);
            }
        }
        return sections;
    }, [transactions]);

    //
    // Modal
    //
    const [modal, setModal] = React.useState<RawTransaction | null>(null);
    const txRef = React.useRef<Modalize>(null);
    React.useEffect(() => {
        if (modal) {
            // What a fuck?
            setTimeout(() => {
                txRef!.current!.open();
            }, 10);
        }
    }, [modal]);


    //
    // Content
    //

    // {!transactions && (
    //     <View style={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
    //         <ActivityIndicator />
    //     </View>
    // )}

    const openReceiveModal = React.useCallback(
        () => {
            showModal(({ hide }) => {
                return (
                    <WalletReceiveComponent onHide={hide} />
                );
            }, modalConfig);
        },
        [modalConfig],
    );

    const openTransactionModal = React.useCallback(
        (transaction: RawTransaction | null) => {
            if (transaction) {
                showModal(({ hide }) => {
                    return (
                        <TransactionPreview tx={transaction} />
                    );
                }, modalConfig);
            }
        },
        [modalConfig],
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
    });

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
    });

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src);
            if (res) {
                // if QR is valid navigate to transfer fragment
                console.log('[onQRCodeRead] navigating with', res.address.toFriendly(), '...');
                navigation.navigate('Transfer', {
                    target: res.address.toFriendly(),
                    comment: res.comment,
                    amount: res.amount
                })
            }

        } catch (error) {
            // Ignore
        }
    };

    //
    // Loading
    //

    if (!account) {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.loader} />
            </View>
        );
    }

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
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}><ValueComponent value={account.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} /></Text>
                    <View style={{ flexGrow: 1 }}>

                    </View>
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
                    transactionsSectioned.length === 0 && (
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
                                onPress={openReceiveModal}
                            />
                        </View>
                    )
                }
                {
                    transactionsSectioned.length > 0 && transactionsSectioned.map((s, i) => (
                        [
                            <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                                <Text style={{ fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
                            </View>,
                            <View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }} collapsable={false}>
                                {s.items.map((t, i) => <TransactionView own={address} tx={t} separator={i < s.items.length - 1} key={'tx-' + t.lt.toString()} onPress={openTransactionModal} />)}
                            </View>
                        ]
                    ))
                }
                {transactionsSectioned.length > 0 && <View style={{ height: 56 }} />}
            </Animated.ScrollView>

            <Portal>
                <Modalize ref={receiveRef} adjustToContentHeight={true} withHandle={false}>
                    <WalletReceiveComponent />
                </Modalize>
            </Portal>

            {
                modal && (
                    <Portal>
                        <Modalize ref={txRef} adjustToContentHeight={true} onClosed={() => setModal(null)} withHandle={false}>
                            <TransactionPreview tx={modal} />
                        </Modalize>
                    </Portal>
                )
            }
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