import { useNavigation } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import React, { useCallback } from "react";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { View, Text, Platform, useWindowDimensions, Image, Pressable, TouchableNativeFeedback } from "react-native";
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { AddressComponent } from "../../components/AddressComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { RoundButton } from "../../components/RoundButton";
import { TransactionView } from "../../components/TransactionView";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { StakingPoolState } from "../../storage/cache";
import { useAccount } from "../../sync/Engine";
import { Transaction } from "../../sync/Transaction";
import { Theme } from "../../Theme";
import { resolveUrl } from "../../utils/resolveUrl";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import TopUpIcon from '../../../assets/ic_top_up.svg';
import { StakingPendingTransaction } from "../../components/Staking/StakingPendingTransaction";
import CalcIcon from '../../../assets/ic_calc.svg'
import ForwardIcon from '../../../assets/ic_chevron_forward.svg'
import { StakingCycle } from "../../components/Staking/StakingCycle";

export const StakingFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const baseNavigation = useNavigation();
    const [account, engine] = useAccount();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const pool = engine.products.stakingPool.useState();
    const transactions = React.useMemo<Transaction[]>(() => {
        let txs = account.transactions.map((v) => engine.getTransaction(v));
        return [...account.pending, ...txs];
    }, [account.transactions, account.pending]);

    const member = pool
        ?.members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

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

    const onDeposit = useCallback(() => {
        navigation.navigate(
            'Transfer',
            {
                target: pool?.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                comment: 'Deposit',
                amount: pool?.minStake.add(toNano('0.2')),
                lockAddress: true,
                lockComment: true,
                staking: {
                    minAmount: pool?.minStake,
                    action: 'deposit',
                }
            }
        );
    }, []);

    const onUnstake = useCallback(() => {
        navigation.navigate(
            'Transfer',
            {
                target: pool?.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                comment: 'Withdraw',
                amount: toNano('0.2'),
                lockAddress: true,
                lockComment: true,
                staking: {
                    minAmount: toNano('0.2'),
                    action: 'withdraw',
                }
            }
        );
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
                        source={require('../../../assets/staking_card.png')}
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

                    <Text
                        style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                    >
                        {t('products.staking.balance')}
                    </Text>
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                        <ValueComponent
                            value={member?.balance || toNano('0')}
                            centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                        />
                    </Text>
                    <PriceComponent amount={member?.balance || toNano('0')} style={{ marginHorizontal: 22, marginTop: 6 }} />
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
                <StakingPendingTransaction onPress={openTransactionFragment} />
                {pool && (
                    <StakingCycle
                        stakeUntil={pool.stakeUntil}
                        style={{
                            marginHorizontal: 16,
                            marginBottom: 15
                        }}
                    />
                )}
                <Pressable style={({ pressed }) => {
                    return {
                        backgroundColor: 'white',
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        opacity: pressed ? 0.3 : 1,
                        flexDirection: 'row',
                        marginHorizontal: 16,
                        paddingVertical: 10,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }
                }}
                    onPress={() => {
                        navigation.navigate('StakingCalc');
                    }}
                >
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <CalcIcon />
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: '#7D858A',
                            marginLeft: 10
                        }}>
                            {t('products.staking.calc.text')}
                        </Text>
                    </View>
                    <ForwardIcon />
                </Pressable>
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
                                <Animated.Text style={[
                                    { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                    { position: 'relative', ...titleOpacityStyle },
                                ]}>
                                    {t('products.staking.title')}
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
                                            source={require('../../../assets/staking_card.png')}
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

                                        <Text
                                            style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                                        >
                                            {t('products.staking.balance')}
                                        </Text>
                                        <Text
                                            style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}
                                        >
                                            <ValueComponent value={member?.balance || toNano('0')} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                                        </Text>
                                        <View style={{ flexGrow: 1 }}>

                                        </View>
                                        <Text style={{ color: 'white', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                            <AddressComponent address={address} />
                                        </Text>
                                    </View>
                                </Animated.View>
                                <HeaderBackButton />
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
                        <View style={{
                            width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        }}>
                            <View style={{
                                position: 'absolute', left: 16, bottom: 8,
                            }}>
                                <TouchableNativeFeedback
                                    onPress={() => navigation.goBack()}
                                    background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                                >
                                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                                    </View>
                                </TouchableNativeFeedback>
                            </View>
                            <Animated.Text style={[
                                { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                                { position: 'relative', ...titleOpacityStyle },
                            ]}>
                                {t('products.staking.title')}
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
                                        source={require('../../../assets/staking_card.png')}
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

                                    <Text
                                        style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                                    >
                                        {t('products.staking.balance')}
                                    </Text>
                                    <Text
                                        style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}
                                    >
                                        <ValueComponent
                                            value={member?.balance || toNano('0')}
                                            centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                                        />
                                    </Text>
                                    <View style={{ flexGrow: 1 }}>

                                    </View>
                                    <Text
                                        style={{ color: 'white', marginLeft: 22, marginBottom: 24, alignSelf: 'flex-start', fontWeight: '500' }}
                                        numberOfLines={1}
                                    >
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
            <View style={{
                height: 64,
                position: 'absolute',
                bottom: safeArea.bottom + 52 + safeArea.bottom + 16,
                left: 16, right: 16,
                flexDirection: 'row',
                justifyContent: 'space-evenly'
            }}>
                <RoundButton
                    display={'secondary'}
                    title={t('products.staking.actions.withdraw')}
                    onPress={onUnstake}
                    style={{
                        flexGrow: 1,
                        marginRight: 7,
                        height: 56
                    }}
                />
                <RoundButton
                    title={t('products.staking.actions.deposit')}
                    onPress={onDeposit}
                    style={{
                        marginLeft: 7,
                        height: 56,
                        flexGrow: 1,
                        maxWidth: (window.width - 32 - 14) / 2
                    }}
                    icon={<TopUpIcon />}
                />
            </View>
        </View>
    );
});

