import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Platform, Image, Pressable } from "react-native";
import Animated, { SensorType, useAnimatedSensor, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingCycle } from "../../components/staking/StakingCycle";
import { StakingPendingComponent } from "../../components/staking/StakingPendingComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { TransferAction } from "./StakingTransferFragment";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { RestrictedPoolBanner } from "../../components/staking/RestrictedPoolBanner";
import { KnownPools } from "../../utils/KnownPools";
import { StakingPoolType } from "./StakingPoolsFragment";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { setStatusBarStyle } from "expo-status-bar";
import { StakingAnalyticsComponent } from "../../components/staking/StakingAnalyticsComponent";

import InfoIcon from '@assets/ic-info-staking.svg';
import { useNetwork, useSelectedAccount, useStakingPool, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, toNano } from "@ton/core";

export const StakingFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const initParams = useParams<{ backToHome?: boolean, pool: string }>();
    const [params, setParams] = useState(initParams);
    const navigation = useTypedNavigation();
    const route = useRoute();
    const isLedger = route.name === 'LedgerStaking';
    const selected = useSelectedAccount();

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const targetPool = Address.parse(params.pool);
    const pool = useStakingPool(targetPool, ledgerAddress);
    const member = pool?.member;
    const config = useStakingWalletConfig(
        isLedger
            ? ledgerAddress!.toString({ testOnly: network.isTestnet })
            : selected!.address.toString({ testOnly: network.isTestnet })
    )

    const animSensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withTiming(animSensor.sensor.value.y * 80) },
                { translateY: withTiming(animSensor.sensor.value.x * 80) },
            ]
        }
    });

    let type: StakingPoolType = useMemo(() => {
        if (KnownPools(network.isTestnet)[params.pool].name.toLowerCase().includes('club')) {
            return 'club';
        }
        if (KnownPools(network.isTestnet)[params.pool].name.toLowerCase().includes('team')) {
            return 'team';
        }
        return 'nominators'
    }, []);

    let available = useMemo(() => {
        if (network.isTestnet) {
            return true;
        }
        return !config!.pools.find((v2) => Address.parse(v2).equals(targetPool))
    }, [config, targetPool]);

    const transferAmount = (pool?.params?.minStake ?? 0n)
        + (pool?.params?.receiptPrice ?? 0n)
        + (pool?.params?.depositFee ?? 0n);

    const onTopUp = useCallback(() => {
        if (isLedger) {
            navigation.navigate('LedgerStakingTransfer', {
                target: targetPool,
                amount: transferAmount,
                lockAddress: true,
                lockComment: true,
                action: 'top_up' as TransferAction,
            });
            return;
        }
        navigation.navigateStaking({
            target: targetPool,
            amount: transferAmount,
            lockAddress: true,
            lockComment: true,
            action: 'top_up' as TransferAction,
        });
    }, [targetPool, pool, transferAmount]);

    const onUnstake = useCallback(() => {
        if (isLedger) {
            navigation.navigate('LedgerStakingTransfer', {
                target: targetPool,
                lockAddress: true,
                lockComment: true,
                action: 'withdraw' as TransferAction,
            });
            return;
        }
        navigation.navigateStaking({
            target: targetPool,
            lockAddress: true,
            lockComment: true,
            action: 'withdraw' as TransferAction,
        });
    }, [targetPool]);

    const openMoreInfo = useCallback(() => openWithInApp(network.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking'), [network.isTestnet]);
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const openPoolSelector = useCallback(() => {
        navigation.navigate(
            isLedger ? 'StakingPoolSelectorLedger' : 'StakingPoolSelector',
            {
                current: targetPool,
                callback: (pool: Address) => {
                    setParams((prev) => ({ ...prev, pool: pool.toString({ testOnly: network.isTestnet }) }));
                }
            },
        )
    }, [isLedger, targetPool, setParams]);

    const hasStake = (member?.balance || 0n)
        + (member?.pendingWithdraw || 0n)
        + (member?.withdraw || 0n)
        > 0n;

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(
                Platform.OS === 'ios'
                    ? 'dark'
                    : theme.style === 'dark' ? 'light' : 'dark'
            )
        }, 10);
    });

    return (
        <View style={{ flex: 1 }}>
            <ScreenHeader
                style={{ marginTop: 32, paddingLeft: 16 }}
                onBackPressed={navigation.goBack}
                rightButton={
                    <Pressable
                        onPress={openMoreInfo}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            position: 'absolute',
                            bottom: 12, right: 16
                        })}
                    >
                        <InfoIcon height={26} width={26} style={{ height: 26, width: 26 }} />
                    </Pressable>
                }
                titleComponent={
                    <Pressable
                        style={({ pressed }) => ({
                            alignItems: 'center',
                            opacity: pressed ? 0.5 : 1
                        })}
                        onPress={openPoolSelector}
                    >
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary,
                            fontWeight: '500',
                        }}>
                            {KnownPools(network.isTestnet)[params.pool].name}
                        </Text>
                    </Pressable>
                }
            />
            <Animated.ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
                style={{ flexGrow: 1 }}
                scrollEventThrottle={16}
            >
                <View
                    style={{
                        marginVertical: 16,
                        backgroundColor: theme.cardBackground,
                        borderRadius: 20,
                        paddingHorizontal: 20, paddingVertical: 16,
                        overflow: 'hidden'
                    }}
                    collapsable={false}
                >
                    <Text
                        style={{
                            fontSize: 15, lineHeight: 20,
                            color: theme.textThird,
                            opacity: 0.7,
                        }}
                    >
                        {t('products.staking.balance')}
                    </Text>
                    <Text style={{ fontSize: 27, color: theme.textThird, fontWeight: '600', marginTop: 14 }}>
                        <ValueComponent
                            value={member?.balance || 0n}
                            precision={4}
                            centFontStyle={{ opacity: 0.5 }}
                        />
                        <Text style={{
                            fontSize: 17,
                            lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                            color: theme.textThird,
                            marginRight: 8,
                            fontWeight: '500',
                            opacity: 0.5
                        }}>{' TON'}</Text>
                    </Text>
                    <Animated.View
                        style={[
                            {
                                position: 'absolute', top: 0, left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400,
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
                                amount={member?.balance || 0n}
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
                    <WalletAddress
                        value={targetPool.toString({ testOnly: network.isTestnet })}
                        address={targetPool}
                        elipsise
                        style={{
                            marginTop: 20,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            fontSize: 15,
                            lineHeight: 20,
                            textAlign: 'left',
                            color: theme.textSecondary,
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        limitActions
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: theme.surfaceSecondary,
                        borderRadius: 20,
                        marginBottom: 16, marginTop: 32
                    }}
                    collapsable={false}
                >
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={onTopUp}
                            disabled={!available}
                            style={({ pressed }) => {
                                return {
                                    opacity: (pressed || !available) ? 0.5 : 1,
                                    borderRadius: 14, flex: 1, paddingVertical: 10,
                                    marginHorizontal: 10
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
                                    <Image source={require('@assets/ic-plus.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}>
                                    {t('products.staking.actions.top_up')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={onUnstake}
                            disabled={!hasStake}
                            style={({ pressed }) => ({
                                opacity:
                                    (!hasStake || pressed) ? 0.5 : 1,
                                borderRadius: 14, flex: 1, paddingVertical: 10,
                                marginHorizontal: 4
                            })}
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
                                        fontSize: 15,
                                        color: theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}
                                >
                                    {t('products.staking.actions.withdraw')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={() => navigation.navigateStakingCalculator({ target: targetPool })}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                borderRadius: 14, flex: 1, paddingVertical: 10,
                                marginHorizontal: 4
                            })}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('@assets/ic-staking-calc.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}
                                >
                                    {t('products.staking.actions.calc')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
                {!!pool && (
                    <StakingCycle
                        stakeUntil={pool.status.proxyStakeUntil}
                        locked={pool.status.locked}
                        style={{ marginBottom: 16 }}
                    />
                )}
                <StakingPendingComponent
                    target={targetPool}
                    member={member}
                />
                {(type !== 'nominators' && !available) && (
                    <RestrictedPoolBanner type={type} />
                )}
                {network.isTestnet && (
                    <RestrictedPoolBanner type={'team'} />
                )}
                <StakingAnalyticsComponent pool={targetPool} />
                <View style={Platform.select({ android: { height: safeArea.bottom + 186 } })} />
            </Animated.ScrollView >
        </View>
    );
});

