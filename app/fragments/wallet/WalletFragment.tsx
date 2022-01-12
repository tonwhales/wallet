import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Cell, parseTransaction, RawTransaction } from 'ton';
import { fragment } from "../../fragment";
import { getAppState, storage } from '../../utils/storage';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import Animated from 'react-native-reanimated';
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
import { format, formatDistance, formatDistanceStrict, isThisYear, isToday, isYesterday } from 'date-fns';
import { useTranslation } from "react-i18next";
import { t } from 'i18next';
import { formatDate } from '../../utils/formatDate';
import { BlurView } from 'expo-blur';
import { showModal } from '../../components/FastModal/showModal';

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
    }
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
    // Loading
    //

    if (!account) {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.loader} />
            </View>
        )
    }

    //
    // Content
    //

    // {!transactions && (
    //     <View style={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
    //         <ActivityIndicator />
    //     </View>
    // )}

    const scrollViewRef = React.useRef<ScrollView>(null);

    React.useEffect(() => {
        scrollViewRef?.current?.scrollTo({ y: -(safeArea.top) });
        return () => {
        };
    }, [scrollViewRef]);

    const openReceiveModal = React.useCallback(
        () => {
            showModal(({ hide }) => {
                return (
                    <WalletReceiveComponent />
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

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom + 52 }}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: Platform.OS === 'android'
                        ? safeArea.top + 44
                        : undefined,
                }}
                contentInset={{ top: safeArea.top }}
                scrollToOverflowEnabled={true}
                overScrollMode={'always'}
            >
                {Platform.OS === 'ios' && (<View style={{ height: safeArea.top }} />)}
                <View style={{ marginHorizontal: 16, marginVertical: 16, height: 196, backgroundColor: '#303757', borderRadius: 14 }} collapsable={false}>
                    <Text style={{ fontSize: 14, color: 'white', opacity: 0.6, marginTop: 22, marginLeft: 22 }}>{t('Wallet balance')}</Text>
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800' }}><ValueComponent value={account.balance} centFontSize={22} /></Text>
                    <View style={{ flexGrow: 1 }}>

                    </View>
                    <Text style={{ color: 'white', marginLeft: 22, marginBottom: 22, marginRight: 86, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="middle">{address.toFriendly()}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    <Pressable
                        style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: 'white', borderRadius: 14 }}
                        // onPress={() => receiveRef.current!.open()}
                        onPress={openReceiveModal}
                    >
                        <Text style={{ fontSize: 18, color: '#1C8FE3' }}>{t("Receive")}</Text>
                    </Pressable>
                    <Pressable
                        style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: 'white', borderRadius: 14 }}
                        onPress={() => navigation.navigate('Transfer')}
                    >
                        <Text style={{ fontSize: 18, color: '#1C8FE3' }}>{t("Send")}</Text>
                    </Pressable>
                </View>

                {
                    transactionsSectioned.length === 0 && (
                        <View style={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                            <LottieView
                                source={require('../../../assets/animations/chicken.json')}
                                autoPlay={true}
                                loop={false}
                                progress={0.2}
                                style={{ width: 200, height: 200, marginBottom: 16 }}
                            />
                            {/* <Text style={{ fontSize: 18, marginBottom: 16 }}>Wallet Created</Text> */}
                            <RoundButton
                                title={t("Receive TONCOIN")}
                                size="normal"
                                display="outline"
                                onPress={openReceiveModal}
                            // onPress={() => receiveRef.current!.open()}
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
                                {s.items.map((t) => <TransactionView tx={t} key={'tx-' + t.lt.toString()} onPress={openTransactionModal} />)}
                            </View>
                        ]
                    ))
                }
                {transactionsSectioned.length > 0 && <View style={{ height: 56 }} />}
            </ScrollView>

            {/* <Animated.View style={[
                { alignSelf: 'stretch', backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', paddingTop: 1000 + safeArea.top, marginTop: -1000, paddingBottom: 16, position: 'absolute', top: 0, left: 0, right: 0, height: 300 + 1000 + safeArea.top },
                containerStyle
            ]}>
            <View style={{ flexGrow: 1 }} />
            
            <Animated.View style={[{ flexDirection: 'row', marginTop: 72, marginHorizontal: 8 }, buttonsContainerStyle]}>
            <RoundButton title={t("Send")} style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => navigation.navigate('Transfer')} />
            <RoundButton title={t("Receive")} style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => receiveRef.current!.open()} />
            </Animated.View>
            </Animated.View>
            
            <Animated.View style={[{ position: 'absolute', top: safeArea.top, left: 0, right: 0, marginBottom: 24, height: 44, alignItems: 'center', justifyContent: 'center' }, buttonsContainerStyle]}>
            <Text style={{ color: 'white', opacity: 0.6 }}>
            {Date.now() - account.storedAt > 10000 ? t('Updating...') : t('Up to date')}
            </Text>
            </Animated.View>
            
            <Animated.View style={[{ position: 'absolute', alignItems: 'center', paddingTop: safeArea.top, left: 0, right: 0, top: 0 }, balanceTransform]}>
            <Animated.Text style={[{ fontSize: 45, fontWeight: '500', color: 'white' }, balanceFont]}>
            💎 <ValueComponent value={account.balance} centFontSize={20} />
            </Animated.Text>
            <Text style={{ color: 'white', opacity: 0.6, marginTop: 2 }}>
            {t('Your balance')}
            </Text>
        </Animated.View> */}

            {Platform.OS === 'android' && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: safeArea.top + 44,
                    backgroundColor: Theme.background,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                >
                    <Text style={{ fontSize: 22, color: Theme.textColor }}>Tonhub</Text>
                </View>
            )}
            {Platform.OS === 'ios' && (
                <BlurView style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: safeArea.top + 44,
                    // backgroundColor: Theme.background,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                    intensity={100}
                >
                    <Text style={{ fontSize: 22, color: Theme.textColor }}>Tonhub</Text>
                </BlurView>
            )}

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
        </View >
    );
});