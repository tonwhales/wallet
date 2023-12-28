import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Platform, Image, Pressable } from "react-native";
import Animated from "react-native-reanimated";
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
import { StakingAnalyticsComponent } from "../../components/staking/StakingAnalyticsComponent";
import { useNetwork, usePendingTransactions, useSelectedAccount, useStakingActive, useStakingPool, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, toNano } from "@ton/core";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PendingTransactionsView } from "../wallet/views/PendingTransactions";

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
    const bottomBarHeight = useBottomTabBarHeight();
    const active = useStakingActive();
    const [pendingTxs, setPending] = usePendingTransactions(selected?.addressString ?? '', network.isTestnet);

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
    );

    const pendingPoolTxs = useMemo(() => {
        return pendingTxs.filter((tx) => {
            return tx.address?.equals(targetPool);
        });
    }, [pendingTxs, targetPool]);

    const removePending = useCallback((id: string) => {
        setPending((prev) => {
            return prev.filter((tx) => tx.id !== id);
        });
    }, [setPending]);

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
        return !!config?.pools.find((v2) => {
            return Address.parse(v2).equals(targetPool)
        })
    }, [config, targetPool, network]);

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
        if (active.length < 2) {
            return;
        }
        navigation.navigate(
            isLedger ? 'StakingPoolSelectorLedger' : 'StakingPoolSelector',
            {
                current: targetPool,
                callback: (pool: Address) => {
                    setParams((prev) => ({ ...prev, pool: pool.toString({ testOnly: network.isTestnet }) }));
                }
            },
        )
    }, [isLedger, targetPool, setParams, active]);

    const hasStake = (member?.balance || 0n)
        + (member?.pendingWithdraw || 0n)
        + (member?.pendingDeposit || 0n)
        + (member?.withdraw || 0n)
        > 0n;

    // weird bug with status bar not changing color with component
    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ScreenHeader
                style={{ marginTop: 32, paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                rightButton={
                    <Pressable
                        onPress={openMoreInfo}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            position: 'absolute',
                            bottom: 12, right: 0,
                            backgroundColor: theme.surfaceOnElevation,
                            height: 32, width: 32, borderRadius: 16,
                            justifyContent: 'center', alignItems: 'center'
                        })}
                    >
                        <Image
                            source={require('@assets/ic-info.png')}
                            style={{
                                tintColor: theme.iconNav,
                                height: 16, width: 16,
                            }}
                        />
                    </Pressable>
                }
                titleComponent={
                    <Pressable
                        style={({ pressed }) => ({
                            alignItems: 'center',
                            opacity: (pressed && active.length >= 2) ? 0.5 : 1
                        })}
                        onPress={openPoolSelector}
                    >
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary,
                            fontWeight: '500',
                        }}>
                            {KnownPools(network.isTestnet)[params.pool]?.name}
                        </Text>
                    </Pressable>
                }
            />
            <Animated.ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
                style={{ flexGrow: 1 }}
                scrollEventThrottle={16}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
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
                            color: theme.textUnchangeable,
                            opacity: 0.7,
                        }}
                    >
                        {t('products.staking.balance')}
                    </Text>
                    <Text style={{ fontSize: 27, color: theme.textUnchangeable, fontWeight: '600', marginTop: 14 }}>
                        <ValueComponent
                            value={member?.balance || 0n}
                            precision={4}
                            centFontStyle={{ opacity: 0.5 }}
                        />
                        <Text style={{
                            fontSize: 17,
                            lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                            color: theme.textUnchangeable,
                            marginRight: 8,
                            fontWeight: '500',
                            opacity: 0.5
                        }}>{' TON'}</Text>
                    </Text>
                    <View
                        style={{
                            position: 'absolute', top: 0, left: '50%',
                            marginTop: -20, marginLeft: -20,
                            height: 400, width: 400,
                            overflow: 'hidden'
                        }}
                        pointerEvents={'none'}
                    >
                        <Image
                            source={require('@assets/shine-blur.webp')}
                            style={{ height: 400, width: 400 }}
                        />
                    </View>
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
                                textStyle={{ color: theme.textUnchangeable }}
                                theme={theme}
                            />
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: 'rgba(255,255,255, .1)', marginLeft: 10 }}
                                textStyle={{ color: theme.textUnchangeable }}
                                theme={theme}
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
                        disableContextMenu
                        copyOnPress
                        copyToastProps={{ marginBottom: bottomBarHeight + 16 }}
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 20,
                        marginBottom: 16, marginTop: 32,
                        padding: 20
                    }}
                    collapsable={false}
                >
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
                        <Pressable
                            onPress={onTopUp}
                            disabled={!available}
                            style={({ pressed }) => {
                                return {
                                    opacity: (pressed || !available) ? 0.5 : 1,
                                    borderRadius: 14, flex: 1, paddingVertical: 10,
                                    marginHorizontal: 4
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
                                    }}
                                    minimumFontScale={0.7}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                >
                                    {t('products.staking.actions.top_up')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
                        <Pressable
                            onPress={onUnstake}
                            disabled={!hasStake}
                            style={({ pressed }) => ({
                                opacity: (!hasStake || pressed) ? 0.5 : 1,
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
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
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
                {!!pendingPoolTxs && pendingPoolTxs.length > 0 && (
                    <PendingTransactionsView
                        theme={theme}
                        pending={pendingPoolTxs}
                        removePending={removePending}
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

