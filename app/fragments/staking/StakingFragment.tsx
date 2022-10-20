import { HeaderBackButton } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import React, { useCallback, useMemo } from "react";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, useWindowDimensions, Image, Pressable, TouchableNativeFeedback } from "react-native";
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { AddressComponent } from "../../components/AddressComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { RoundButton } from "../../components/RoundButton";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { getCurrentAddress } from "../../storage/appState";
import { useEngine } from "../../engine/Engine";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import TopUpIcon from '../../../assets/ic_top_up.svg';
import { StakingCycle } from "../../components/Staking/StakingCycle";
import { StakingPendingComponent } from "../../components/Staking/StakingPendingComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { TransferAction } from "./StakingTransferFragment";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { RestrictedPoolBanner } from "../../components/Staking/RestrictedPoolBanner";
import { KnownPools } from "../../utils/KnownPools";

export const StakingFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const params = useParams<{ backToHome?: boolean, pool: string }>();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const target = Address.parse(params.pool);
    const pool = engine.products.whalesStakingPools.usePool(target);
    const poolParams = pool?.params;
    const member = pool?.member;
    const staking = engine.products.whalesStakingPools.useStaking();

    let type: 'club' | 'team' | 'nominators' = useMemo(() => {
        if (KnownPools[params.pool].name.toLowerCase().includes('club')) {
            return 'club';
        }
        if (KnownPools[params.pool].name.toLowerCase().includes('team')) {
            return 'team';
        }
        return 'nominators'
    }, [staking]);

    let available = useMemo(() => {
        return !!staking.config!.pools.find((v2) => Address.parse(v2).equals(target))
    }, [staking, target]);

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

    const onTopUp = useCallback(() => {
        navigation.navigateStaking({
            target: target,
            amount: pool?.params.minStake.add(pool.params.receiptPrice).add(pool.params.depositFee),
            lockAddress: true,
            lockComment: true,
            action: 'top_up' as TransferAction,
        });
    }, [target, pool]);

    const onUnstake = useCallback(() => {
        navigation.navigateStaking({
            target: target,
            lockAddress: true,
            lockComment: true,
            action: 'withdraw' as TransferAction,
        });
    }, [target]);

    const openMoreInfo = useCallback(
        () => {
            openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking');
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
                        value={target.toFriendly({ testOnly: AppConfig.isTestnet })}
                        address={
                            target.toFriendly({ testOnly: AppConfig.isTestnet }).slice(0, 6)
                            + '...'
                            + target.toFriendly({ testOnly: AppConfig.isTestnet }).slice(t.length - 8)
                        }
                        style={{
                            marginLeft: 22,
                            marginBottom: 16,
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
                <StakingPendingComponent
                    target={target}
                    style={{ marginHorizontal: 16 }}
                    params={poolParams}
                    member={member}
                />
                {pool && (
                    <StakingCycle
                        stakeUntil={pool.params.stakeUntil}
                        locked={pool.params.locked}
                        style={{
                            marginHorizontal: 16,
                            marginBottom: 24
                        }}
                    />
                )}
                {type !== 'nominators' && !available && (
                    <RestrictedPoolBanner type={type} />
                )}
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
                        }}>
                            <View style={{
                                width: '100%', height: 44,
                                alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'row'
                            }}>
                                <HeaderBackButton
                                    style={{
                                        position: 'absolute',
                                        left: 0, bottom: 0
                                    }}
                                    label={t('common.back')}
                                    labelVisible
                                    onPress={() => {
                                        if (params.backToHome) {
                                            navigation.popToTop();
                                            return;
                                        }
                                        navigation.goBack();
                                    }}
                                    tintColor={Theme.accent}
                                />
                                <Animated.Text
                                    style={[
                                        { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                                        { position: 'relative', ...titleOpacityStyle },
                                    ]}
                                >
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
                                    pointerEvents="none"
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
                                        <Text style={{ color: 'white', marginLeft: 22, marginBottom: 16, alignSelf: 'flex-start', fontWeight: '500' }} numberOfLines={1}>
                                            <AddressComponent address={target} />
                                        </Text>
                                    </View>
                                </Animated.View>
                                <Pressable
                                    onPress={openMoreInfo}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.3 : 1,
                                            position: 'absolute',
                                            bottom: 12, right: 16
                                        }
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: Theme.accent,
                                            fontSize: 17, fontWeight: '600'
                                        }}
                                    >
                                        {t('products.staking.learnMore')}
                                    </Text>
                                </Pressable>
                                {/* TODO */}
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
                            flexDirection: 'row'
                        }}>
                            <View style={{
                                position: 'absolute',
                                left: 16, bottom: 8
                            }}>
                                <TouchableNativeFeedback
                                    onPress={() => {
                                        if (params.backToHome) {
                                            navigation.popToTop();
                                            return;
                                        }
                                        navigation.goBack();
                                    }}
                                    background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                                >
                                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                                    </View>
                                </TouchableNativeFeedback>
                            </View>
                            <Animated.Text style={[
                                { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
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
                                        <AddressComponent address={target} />
                                    </Text>
                                </View>
                            </Animated.View>
                            <Pressable onPress={openMoreInfo} style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.3 : 1,
                                    position: 'absolute', right: 16, bottom: 10,
                                }
                            }}>
                                <Text
                                    style={{
                                        color: Theme.accent,
                                        fontSize: 17, fontWeight: '600'
                                    }}
                                >
                                    {t('products.staking.learnMore')}
                                </Text>
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
            <View style={{
                height: 64,
                position: 'absolute',
                bottom: safeArea.bottom + 16,
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
                    title={t('products.staking.actions.top_up')}
                    onPress={onTopUp}
                    disabled={!available}
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

