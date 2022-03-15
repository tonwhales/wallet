import BN from "bn.js";
import React from "react"
import { View, Text, Platform, useWindowDimensions, Image } from "react-native"
import { Address, toNano } from "ton";
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Transaction } from "../sync/Transaction";
import { formatDate, getDateKey } from "../utils/dates";
import { TransactionView } from "./TransactionView";
import { Theme } from "../Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { getCurrentAddress } from "../storage/appState";
import { useAccount } from "../sync/Engine";
import { ValueComponent } from "./ValueComponent";
import { PriceComponent } from "./PriceComponent";
import { WalletAddress } from "./WalletAddress";
import { AppConfig } from "../AppConfig";
import { TouchableHighlight } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { AddressComponent } from "./AddressComponent";
import { StakingPoolState } from "../storage/cache";
import { HeaderBackButton } from '@react-navigation/elements';

const StakingTransactions = React.memo((props: { txs: Transaction[], address: Address, onPress: (tx: Transaction) => void }) => {
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
                <Text style={{ fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
            </View>
        );
        components.push(
            < View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }
            } collapsable={false} >
                {s.items.map((t, i) => <TransactionView own={props.address} tx={t} separator={i < s.items.length - 1} key={'tx-' + t.id} onPress={props.onPress} />)}
            </View >
        );
    }

    return <>{components}</>;
})

export const StakingMemberComponent = React.memo((props: {
    member: {
        address: Address,
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    },
    pool: StakingPoolState
}) => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const [account, engine] = useAccount();
    const transactions = React.useMemo<Transaction[]>(() => {
        let txs = account.transactions.map((v) => engine.getTransaction(v));
        txs = txs.filter((tx) => {
            return tx.address
                ?.toFriendly({ testOnly: AppConfig.isTestnet }) === props.pool.address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        })
        return [...account.pending, ...txs];
    }, [account.transactions, account.pending, props.pool]);

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
                {/* <Text style={{ fontSize: 12, color: 'black', opacity: 0.8, marginHorizontal: 16, marginTop: 8, padding: 4 }}>
                    Status: {props.pool.locked ? (props.pool.readyToUnlock ? '💸 Recovering stake' : '🔨 Stake sent to elector') : '💨 Cooldown'}
                </Text>
                <Text style={{ fontSize: 12, color: 'black', opacity: 0.8, marginHorizontal: 16, marginTop: 8, padding: 4 }}>
                    Accepting new stakes: {props.pool.enabled ? '✅ Yes!' : '⚠️ Suspended'}
                </Text> */}
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
                    <View
                        style={{
                            backgroundColor: 'white',
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0, right: 0,
                            borderRadius: 14
                        }}
                    />
                    <Text style={{ fontSize: 14, color: 'black', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('stake.balanceTitle')}</Text>
                    <Text style={{ fontSize: 30, color: 'black', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                        <ValueComponent value={props.member.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                    </Text>
                    <PriceComponent style={{ marginHorizontal: 22, marginTop: 6 }} />
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
                            color: 'black',
                            fontWeight: '500',
                            fontFamily: undefined
                        }}
                    />
                </Animated.View>
                {/* actions */}
                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => navigation.navigate(
                                'Transfer',
                                {
                                    target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    comment: 'Deposit',
                                    minAmount: props.pool.minStake,
                                    fromStaking: true
                                }
                            )}
                            underlayColor={Theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('stake.actions.deposit')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => navigation.navigate(
                                'Transfer',
                                {
                                    target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    comment: 'Withdraw',
                                    amount: toNano('0.2'),
                                    fromStaking: true
                                }
                            )}
                            underlayColor={Theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('stake.actions.withdraw')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
                {/* stats */}
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 12, color: 'black', opacity: 0.8 }}>{t('stake.pending.deposit')}</Text>
                        <Text style={{ fontSize: 14, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingDeposit}
                                centFontStyle={{ fontSize: 12, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8 }} />
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 12, color: 'black', opacity: 0.8 }}>{t('stake.pending.withdraw')}</Text>
                        <Text style={{ fontSize: 14, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingWithdraw}
                                centFontStyle={{ fontSize: 12, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8 }} />
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 12, color: 'black', opacity: 0.8, }}>{t('stake.withdraw')}</Text>
                        <Text style={{ fontSize: 14, color: 'black', fontWeight: '800', marginTop: 2, }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.withdraw}
                                centFontStyle={{ fontSize: 12, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                </View>
                {
                    transactions.length === 0 && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: window.height * 0.095 }}>
                            {/* <LottieView
                                source={require('../../assets/animations/duck.json')}
                                autoPlay={true}
                                loop={false}
                                progress={0.2}
                                style={{ width: window.height * 0.15, height: window.height * 0.15, marginBottom: window.height * 0.1 * 0.3 }}
                            /> */}
                            <Text style={{ fontSize: 16, marginBottom: window.height * 0.1 * 0.3, color: '#7D858A' }}>
                                {t('stake.empty.message')}
                            </Text>
                            {/* <RoundButton
                                title={t('stake.empty.join')}
                                size="normal"
                                display="text"
                                onPress={() => navigation.navigate('Receive')}
                            /> */}
                        </View>
                    )
                }
                {
                    transactions.length > 0 && (
                        <StakingTransactions
                            txs={transactions}
                            address={address}
                            onPress={openTransactionFragment}
                        />
                    )
                }
                {transactions.length > 0 && <View style={{ height: 56 }} />}
            </Animated.ScrollView >
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
                                <View style={{
                                    position: 'absolute',
                                    top: 0, bottom: 0, left: 0,
                                    justifyContent: 'center', alignItems: 'center'
                                }}>
                                    <HeaderBackButton onPress={navigation.goBack} />
                                </View>
                                <Animated.Text style={[
                                    { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                    { position: 'relative', ...titleOpacityStyle },
                                ]}>
                                    Staking
                                </Animated.Text>
                                <Animated.View
                                    style={[
                                        {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            position: 'absolute',
                                            top: 0, bottom: 0,
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
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                height: cardHeight,
                                                width: window.width - 32,
                                                backgroundColor: 'white',
                                                borderRadius: 14
                                            }}
                                        />
                                        <Text style={{ fontSize: 14, color: 'black', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('stake.balanceTitle')}</Text>
                                        <Text style={{ fontSize: 30, color: 'black', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}><ValueComponent value={props.member.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} /></Text>
                                        <View style={{ flexGrow: 1 }}>

                                        </View>
                                        <Text style={{ color: 'black', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                            <AddressComponent address={address} />
                                        </Text>
                                    </View>
                                </Animated.View>
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
                                Staking
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
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            height: cardHeight,
                                            width: window.width - 32,
                                            backgroundColor: 'white',
                                            borderRadius: 14
                                        }}
                                    />
                                    <Text style={{ fontSize: 14, color: 'black', opacity: 0.8, marginTop: 22, marginLeft: 22 }}>{t('stake.balanceTitle')}</Text>
                                    <Text style={{ fontSize: 30, color: 'black', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}><ValueComponent value={props.member.balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} /></Text>
                                    <View style={{ flexGrow: 1 }}>

                                    </View>
                                    <Text style={{ color: 'black', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                        <AddressComponent address={address} />
                                    </Text>
                                </View>
                            </Animated.View>
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