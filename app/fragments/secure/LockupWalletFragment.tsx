import { HeaderBackButton } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import React, { useMemo } from "react";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, useWindowDimensions, Image, TouchableNativeFeedback } from "react-native";
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { AddressComponent } from "../../components/AddressComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { useEngine } from "../../engine/Engine";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import BN from "bn.js";
import { RestrictedComponent } from "../../components/Lockup/RestrictedComponent";
import { LockedComponent } from "../../components/Lockup/LockedComponent";

export const LockupWalletFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { address } = useParams<{ address: string }>();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const target = Address.parse(address);
    const walletState = engine.products.lockup.useLockupWallet(target);

    const { totalBalance, liquidBalance } = useMemo(() => {
        let totalBalance = new BN(0);
        let liquidBalance = new BN(0);
        if (!walletState) {
            return { totalBalance, liquidBalance };
        }
        totalBalance = totalBalance.add(walletState.balance);
        liquidBalance = liquidBalance.add(walletState.balance);
        if (!walletState.wallet) {
            return { totalBalance, liquidBalance };
        }
        if (walletState.wallet?.totalLockedValue) {
            totalBalance = totalBalance.add(walletState.wallet.totalLockedValue);
        }
        if (walletState.wallet.locked) {
            for (let locked of Array.from(walletState.wallet.locked)) {
                if (parseInt(locked[0]) < (Date.now() / 1000)) {
                    liquidBalance = liquidBalance.add(locked[1]);
                }
            }
        }
        if (walletState.wallet?.totalRestrictedValue) {
            totalBalance = totalBalance.add(walletState.wallet.totalRestrictedValue);
        }
        if (walletState.wallet.restricted) {
            for (let restricted of Array.from(walletState.wallet.restricted)) {
                if (parseInt(restricted[0]) < (Date.now() / 1000)) {
                    liquidBalance = liquidBalance.add(restricted[1]);
                }
            }
        }
        return { totalBalance, liquidBalance };
    }, [walletState]);


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
                { translateY: Math.floor(cardHeight * 0.15 / 2), },
                { translateY: -Math.floor(cardHeight * 0.15 / 2), },
                {
                    translateY: withTiming(smallCardY.value, {
                        duration: 300,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    })
                },
                { translateY: Math.floor(cardHeight * 0.15 / 2) - Math.floor(window.height * 0.013), },
                { translateX: -Math.floor((window.width - 32) * 0.15 / 2), },
                { translateX: Math.floor((window.width - 32) * 0.15 / 2) }
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

                    <Text style={{
                        fontSize: 14,
                        color: 'white',
                        opacity: 0.8,
                        marginTop: 22,
                        marginLeft: 22
                    }}>
                        {t('products.lockups.totalBalance')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                            style={{
                                marginLeft: 22,
                                flexDirection: 'row', alignItems: 'center'
                            }}
                        >
                            <Text style={{
                                fontSize: 26,
                                color: 'white',
                                marginRight: 8,
                                fontWeight: '800',
                            }}>
                                <ValueComponent
                                    value={totalBalance}
                                    centFontStyle={{ fontSize: 20, fontWeight: '500', opacity: 0.55 }}
                                />
                            </Text>
                        </View>
                    </View>
                    <PriceComponent
                        amount={totalBalance}
                        style={{ marginHorizontal: 22 }}
                    />
                    <View style={{ flexGrow: 1 }} />
                    <Text style={{
                        fontSize: 14,
                        color: 'white',
                        opacity: 0.8,
                        marginTop: 12,
                        marginLeft: 22
                    }}>
                        {t('products.lockups.liquidBalance')}
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 22,
                        marginBottom: 22
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 22,
                                color: 'white',
                                marginRight: 8,
                                fontWeight: '800',
                                marginTop: 2
                            }}>
                                <ValueComponent
                                    value={liquidBalance}
                                    centFontStyle={{ fontSize: 16, fontWeight: '500', opacity: 0.55 }}
                                />
                            </Text>
                            <PriceComponent amount={liquidBalance} />
                        </View>
                        <WalletAddress
                            value={target.toFriendly({ testOnly: AppConfig.isTestnet })}
                            address={target}
                            elipsise
                            style={{
                                alignSelf: 'flex-end',
                                marginRight: 8
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
                </Animated.View>

                {!!walletState && (
                    <>
                        <LockedComponent lockup={walletState} />
                        <RestrictedComponent lockup={walletState} />
                    </>
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
                                    {t('products.lockups.wallet')}
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

                                        <Text style={{
                                            fontSize: 14,
                                            color: 'white',
                                            opacity: 0.8,
                                            marginTop: 22,
                                            marginLeft: 22
                                        }}>
                                            {t('products.lockups.totalBalance')}
                                        </Text>
                                        <Text style={{
                                            fontSize: 30,
                                            color: 'white',
                                            marginHorizontal: 22,
                                            fontWeight: '800',
                                            height: 40,
                                            marginTop: 2
                                        }}>
                                            <ValueComponent
                                                value={totalBalance}
                                                centFontStyle={{
                                                    fontSize: 22,
                                                    fontWeight: '500',
                                                    opacity: 0.55
                                                }}
                                            />
                                        </Text>
                                        <View style={{ flexGrow: 1 }}>

                                        </View>
                                        <Text
                                            style={{
                                                color: 'white',
                                                marginLeft: 22,
                                                marginBottom: 16,
                                                alignSelf: 'flex-start',
                                                fontWeight: '500'
                                            }}
                                            numberOfLines={1}
                                        >
                                            <AddressComponent address={target} />
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
                                        navigation.goBack();
                                    }}
                                    background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)}
                                    hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
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
                                {t('products.lockups.wallet')}
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

                                    <Text style={{
                                        fontSize: 14,
                                        color: 'white',
                                        opacity: 0.8,
                                        marginTop: 22,
                                        marginLeft: 22
                                    }}
                                    >
                                        {t('products.lockups.totalBalance')}
                                    </Text>
                                    <Text style={{
                                        fontSize: 30,
                                        color: 'white',
                                        marginHorizontal: 22,
                                        fontWeight: '800',
                                        height: 40,
                                        marginTop: 2
                                    }}
                                    >
                                        <ValueComponent
                                            value={walletState?.balance ?? new BN(0)}
                                            centFontStyle={{
                                                fontSize: 22,
                                                fontWeight: '500',
                                                opacity: 0.55
                                            }}
                                        />
                                    </Text>
                                    <View style={{ flexGrow: 1 }}>

                                    </View>
                                    <Text
                                        style={{
                                            color: 'white',
                                            marginLeft: 22,
                                            marginBottom: 24,
                                            alignSelf: 'flex-start',
                                            fontWeight: '500'
                                        }}
                                        numberOfLines={1}
                                    >
                                        <AddressComponent address={target} />
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
        </View>
    );
});

