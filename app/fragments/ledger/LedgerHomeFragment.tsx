import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { useCallback, useEffect, useMemo } from "react";
import { t } from "../../i18n/t";
import Animated, { SensorType, useAnimatedScrollHandler, useAnimatedSensor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { warn } from "../../utils/log";
import { Pressable, View, Image, Text, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { LedgerWalletHeader } from "./components/LedgerWalletHeader";
import { useAccountLite, useNetwork, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { Address, toNano } from "@ton/core";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";

export const LedgerHomeFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();

    const address = useMemo(() => {
        if (!ledgerContext?.addr) {
            return null;
        }
        try {
            return Address.parse(ledgerContext.addr.address);
        } catch {}
    }, [ledgerContext?.addr?.address]);
    const account = useAccountLite(address);

    // Navigation
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    const navigateTransfer = useCallback(() => {
        navigation.navigate('LedgerSimpleTransfer', {
            amount: null,
            target: null,
            comment: null,
            jetton: null,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const navigateReceive = useCallback(() => {
        if (!ledgerContext?.addr) {
            return;
        }
        navigation.navigate(
            'LedgerReceive',
            {
                addr: ledgerContext.addr.address,
                ledger: true
            }
        );
    }, []);

    // ScrollView background color animation
    const scrollBackgroundColor = useSharedValue(1);
    // Views border radius animation on scroll
    const scrollBorderRadius = useSharedValue(24);

    const onScroll = useAnimatedScrollHandler((event) => {
        if ((event.contentOffset.y) >= 0) { // Overscrolled to top
            scrollBackgroundColor.value = 1;
        } else { // Overscrolled to bottom
            scrollBackgroundColor.value = 0;
        }
        if (event.contentOffset.y <= -(safeArea.top - 290)) {
            scrollBorderRadius.value = 24;
        } else {
            const diffRadius = (safeArea.top - 290) + event.contentOffset.y;
            scrollBorderRadius.value = 24 - diffRadius
        }
    }, []);

    const scrollStyle = useAnimatedStyle(() => {
        return { backgroundColor: scrollBackgroundColor.value === 0 ? theme.backgroundUnchangeable : theme.white };
    });

    const animSensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withTiming(animSensor.sensor.value.y * 80) },
                { translateY: withTiming(animSensor.sensor.value.x * 80) },
            ]
        }
    });

    useEffect(() => {
        ledgerContext?.setFocused(true);
        return () => {
            ledgerContext?.setFocused(false);
        }
    }, []);

    if (
        !ledgerContext?.tonTransport
        || !ledgerContext.addr
    ) {
        navigation.navigateAndReplaceAll('Home');
        return null;
    }

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundUnchangeable }}>
            <StatusBar style={'light'} />
            <LedgerWalletHeader />
            <Animated.ScrollView
                style={[{ flexBasis: 0 }, scrollStyle]}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
            >
                <View
                    style={[
                        {
                            backgroundColor: theme.backgroundUnchangeable,
                            paddingHorizontal: 16,
                            paddingVertical: 20,
                        },
                    ]}
                    collapsable={false}
                >
                    <View style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        paddingVertical: 16, paddingHorizontal: 20,
                        overflow: 'hidden'
                    }}>
                        <Text style={{
                            color: theme.white, opacity: 0.7,
                            fontSize: 15, lineHeight: 20,
                            fontWeight: '400',
                            marginBottom: 14
                        }}>
                            {t('common.balance')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 27,
                                color: theme.white,
                                marginRight: 8,
                                fontWeight: '500',
                                lineHeight: 32,
                            }}>
                                <ValueComponent
                                    precision={4}
                                    value={account?.balance ?? 0n}
                                    centFontStyle={{ opacity: 0.5 }}
                                />
                                <Text style={{
                                    fontSize: 17,
                                    lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                                    color: theme.white,
                                    marginRight: 8,
                                    fontWeight: '500',
                                }}>{' TON'}</Text>
                            </Text>
                        </View>
                        <Animated.View
                            style={[{
                                position: 'absolute', top: 0, left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400,
                                borderRadius: 400,
                                overflow: 'hidden'
                            },
                                animatedStyle
                            ]}
                            pointerEvents={'none'}
                        >
                            <Image
                                source={require('@assets/shine-blur.webp')}
                                style={{ height: 400, width: 400 }}
                            />
                        </Animated.View>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginTop: 10
                        }}>
                            <Pressable
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={navigateToCurrencySettings}
                            >
                                <PriceComponent
                                    amount={account?.balance ?? 0n}
                                    style={{ backgroundColor: 'rgba(255,255,255, .1)' }}
                                    textStyle={{ color: theme.textThird }}
                                />
                                <PriceComponent
                                    showSign
                                    amount={toNano(1)}
                                    style={{ backgroundColor: 'rgba(255,255,255, .1)', marginLeft: 10 }}
                                    textStyle={{ color: theme.textThird }}
                                />
                            </Pressable>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                        {address && (
                            <WalletAddress
                                value={address.toString({ testOnly: network.isTestnet })}
                                address={address}
                                elipsise
                                style={{
                                    marginTop: 20,
                                    alignSelf: 'flex-start',
                                }}
                                textStyle={{
                                    fontSize: 15,
                                    lineHeight: 20,
                                    textAlign: 'left',
                                    color: theme.divider,
                                    fontWeight: '400',
                                    fontFamily: undefined,
                                    opacity: 0.7
                                }}
                                disableContextMenu
                                copyToastProps={{ marginBottom: 16 }}
                                limitActions
                                copyOnPress
                            />
                        )}
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: 20,
                            marginTop: 16,
                            overflow: 'hidden'
                        }}
                        collapsable={false}
                    >
                        <View style={{
                            flexGrow: 1, flexBasis: 0,
                            marginRight: 7,
                            borderRadius: 14,
                            padding: 10
                        }}>
                            <Pressable
                                onPress={navigateReceive}
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1,
                                        borderRadius: 14, flex: 1, paddingVertical: 10,
                                        marginHorizontal: 20
                                    }
                                }}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                    <View style={{
                                        backgroundColor: theme.accent,
                                        width: 32, height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image source={require('@assets/ic_receive.png')} />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textThird,
                                            marginTop: 6
                                        }}>
                                        {t('wallet.actions.receive')}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                        <View style={{
                            flexGrow: 1, flexBasis: 0,
                            marginRight: 7,
                            borderRadius: 14,
                            padding: 10
                        }}>
                            <Pressable
                                onPress={navigateTransfer}
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1,
                                        borderRadius: 14, flex: 1, paddingVertical: 10,
                                        marginHorizontal: 20
                                    }
                                }}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                    <View style={{
                                        backgroundColor: theme.accent,
                                        width: 32, height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image source={require('@assets/ic_send.png')} />
                                    </View>
                                    <Text style={{ fontSize: 15, color: theme.textThird, marginTop: 6, fontWeight: '400' }}>
                                        {t('wallet.actions.send')}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                        <Animated.View
                            style={[{
                                position: 'absolute', top: '-175%', left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400, borderRadius: 200,
                                overflow: 'hidden'
                            },
                                animatedStyle
                            ]}
                            pointerEvents={'none'}
                        >
                            <Image
                                source={require('@assets/shine-blur.webp')}
                                style={{ height: 400, width: 400 }}
                            />
                        </Animated.View>
                    </View>
                </View>
                <LedgerProductsComponent />
                <View style={{ height: 100, width: '100%', backgroundColor: theme.surfacePimary }} />
            </Animated.ScrollView>
        </View>
    );
})