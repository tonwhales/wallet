import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { t } from "../../i18n/t";
import Animated, { SensorType, useAnimatedScrollHandler, useAnimatedSensor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Pressable, View, Image, Text, Platform, ScrollView } from "react-native";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { LedgerWalletHeader } from "./components/LedgerWalletHeader";
import { useAccountLite, useAccountsLite, useNetwork, useStaking, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { Address, toNano } from "@ton/core";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fullScreen } from "../../Navigation";
import { StakingFragment } from "../staking/StakingFragment";
import { StakingPoolsFragment } from "../staking/StakingPoolsFragment";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";

export const LedgerHomeFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();
    const bottomBarHeight = useBottomTabBarHeight();

    const address = useMemo(() => {
        if (!ledgerContext?.addr) {
            return null;
        }
        try {
            return Address.parse(ledgerContext.addr.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const account = useAccountLite(address!, true)!;
    const staking = useStaking(address!);

    const stakingBalance = useMemo(() => {
        if (!staking) {
            return 0n;
        }
        return staking.total;
    }, [staking]);

    const balance = useMemo(() => {
        const accountWithStaking = (account ? BigInt(account.balance) : 0n)
            + (stakingBalance || 0n);

        return accountWithStaking;
    }, [account, stakingBalance]);

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

    if (
        !ledgerContext?.tonTransport
        || !ledgerContext.addr
    ) {
        navigation.navigateAndReplaceAll('Home');
        return null;
    }

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={'light'} />
            <LedgerWalletHeader />
            <ScrollView
                style={{ flexBasis: 0 }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
            >
                {Platform.OS === 'ios' && (
                    <View
                        style={{
                            backgroundColor: theme.backgroundUnchangeable,
                            height: 1000,
                            position: 'absolute',
                            top: -1000,
                            left: 0,
                            right: 0,
                        }}
                    />
                )}
                <View collapsable={false}>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingTop: 24,
                        paddingHorizontal: 16,
                        backgroundColor: theme.backgroundUnchangeable
                    }}>
                        <View>
                            <PriceComponent
                                amount={balance}
                                style={{
                                    alignSelf: 'center',
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: undefined,
                                    paddingVertical: undefined,
                                    paddingLeft: undefined,
                                    borderRadius: undefined,
                                    height: undefined,
                                }}
                                textStyle={{
                                    fontSize: 32,
                                    color: theme.textOnsurfaceOnDark,
                                    fontWeight: '500',
                                    lineHeight: 38
                                }}
                                centsTextStyle={{ color: theme.textSecondary }}
                                theme={theme}
                            />
                            {!account && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        overflow: 'hidden',
                                        borderRadius: 8,
                                    }}
                                >
                                    {Platform.OS === 'android' ? (
                                        <View
                                            style={{
                                                flexGrow: 1,
                                                backgroundColor: theme.surfaceOnBg,
                                            }}
                                        />
                                    ) : (
                                        <BlurView
                                            tint={theme.style === 'dark' ? 'dark' : 'light'}
                                            style={{ flexGrow: 1 }}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                        <Pressable
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
                            onPress={navigateToCurrencySettings}
                        >
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                                textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                theme={theme}
                            />
                        </Pressable>
                        <View style={{ flexGrow: 1 }} />
                        <WalletAddress
                            value={address!.toString({ testOnly: network.isTestnet })}
                            address={address!}
                            elipsise={{ start: 4, end: 4 }}
                            style={{
                                marginTop: 16,
                                alignSelf: 'center',
                            }}
                            textStyle={{
                                fontSize: 15,
                                lineHeight: 20,
                                color: theme.textUnchangeable,
                                fontWeight: '400',
                                opacity: 0.5,
                                fontFamily: undefined
                            }}
                            disableContextMenu
                            copyOnPress
                            copyToastProps={Platform.select({
                                ios: { marginBottom: 24 + bottomBarHeight, },
                                android: { marginBottom: 16, }
                            })}
                        />
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={{
                            backgroundColor: theme.backgroundUnchangeable,
                            position: 'absolute', top: Platform.OS === 'android' ? -1 : 0, left: 0, right: 0,
                            height: '50%',
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 20,
                        }} />
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: theme.surfaceOnBg,
                                borderRadius: 20,
                                marginTop: 28,
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
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}
                                            minimumFontScale={0.7}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                        >
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
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}
                                            minimumFontScale={0.7}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                        >
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
                <LedgerProductsComponent account={account} />
            </ScrollView>
        </View>
    );
})

const Stack = createNativeStackNavigator();
Stack.Navigator.displayName = 'LedgerStack';

const navigation = (safeArea: EdgeInsets) => [
    fullScreen('Home', LedgerHomeFragment),
    fullScreen('LedgerStaking', StakingFragment),
    fullScreen('LedgerStakingPools', StakingPoolsFragment),
]

export const LedgerNavigationStack = memo(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

    return (
        <Stack.Navigator
            initialRouteName={'Home'}
            screenOptions={{
                headerBackTitle: t('common.back'),
                title: '',
                headerShadowVisible: false,
                headerTransparent: false,
                headerStyle: { backgroundColor: theme.backgroundPrimary }
            }}
        >
            {navigation(safeArea)}
        </Stack.Navigator>
    );
});