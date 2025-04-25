import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, Platform, Image, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingCycle } from "../../components/staking/StakingCycle";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { KnownPools, getLiquidStakingAddress } from "../../utils/KnownPools";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { StakingAnalyticsComponent } from "../../components/staking/StakingAnalyticsComponent";
import { useLiquidStakingMember, useNetwork, usePendingActions, useSelectedAccount, useStakingApy, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, fromNano, toNano } from "@ton/core";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PendingTransactionsList } from "../wallet/views/PendingTransactions";
import { useLiquidStaking } from "../../engine/hooks/staking/useLiquidStaking";
import { Typography } from "../../components/styles";
import { BackButton } from "../../components/navigation/BackButton";
import { LiquidStakingMember } from "../../components/staking/LiquidStakingBalance";
import { TransferAction } from "./StakingTransferFragment";
import { LiquidStakingPendingComponent } from "../../components/staking/LiquidStakingPendingComponent";
import { WalletAddress } from "../../components/address/WalletAddress";
import { extractDomain } from "../../engine/utils/extractDomain";

export const LiquidStakingFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const isLedger = route.name === 'LedgerLiquidStaking';
    const selected = useSelectedAccount();
    const bottomBarHeight = useBottomTabBarHeight();
    const liquidStaking = useLiquidStaking().data;
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);
    const memberAddress = isLedger ? ledgerAddress : selected?.address;
    const nominator = useLiquidStakingMember(memberAddress)?.data;
    const apy = useStakingApy()?.apy;
    const { state: pendingTxs, removePending } = usePendingActions(memberAddress!.toString({ testOnly: network.isTestnet }), network.isTestnet);

    const poolFee = liquidStaking?.extras.poolFee ? Number(toNano(fromNano(liquidStaking?.extras.poolFee))) / 100 : undefined;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(apy - apy * (poolFee / 100)).toFixed(2)}%`;
        }
    }, [apy, poolFee]);

    const balance = useMemo(() => {
        const bal = fromNano(nominator?.balance || 0n);
        const rate = fromNano(liquidStaking?.rateWithdraw || 0n);
        return toNano((parseFloat(bal) * parseFloat(rate)).toFixed(9));
    }, [nominator?.balance, liquidStaking?.rateWithdraw]);

    const { targetPool, targetPoolFriendly } = useMemo(() => {
        const address = getLiquidStakingAddress(network.isTestnet);
        return {
            targetPool: address,
            targetPoolFriendly: address.toString({ testOnly: network.isTestnet })
        }
    }, [network.isTestnet]);

    const stakeUntil = Math.min(liquidStaking?.extras.proxyZeroStakeUntil ?? 0, liquidStaking?.extras.proxyOneStakeUntil ?? 0);

    const pendingPoolTxs = useMemo(() => {
        return pendingTxs.filter((tx) => {
            return tx.address?.equals(targetPool);
        });
    }, [pendingTxs, targetPool]);

    useEffect(() => {
        // Remove transactions after 15 seconds of changing status
        setTimeout(() => {
            const toRemove = pendingPoolTxs
                .filter((tx) => tx.status !== 'pending')
                .map((tx) => tx.id);

            removePending(toRemove);
        }, 15 * 1000);
    }, [pendingPoolTxs]);

    const transferAmount = useMemo(() => {
        return (liquidStaking?.extras.minStake ?? 0n)
            + (liquidStaking?.extras.receiptPrice ?? 0n)
            + (liquidStaking?.extras.depositFee ?? 0n);
    }, [liquidStaking]);

    const onTopUp = useCallback(() => {
        navigation.navigateLiquidStakingTransfer(
            { amount: transferAmount.toString(), action: 'top_up' as TransferAction },
            { ledger: isLedger }
        );
    }, [transferAmount, isLedger]);

    const onUnstake = useCallback(() => {
        navigation.navigateLiquidWithdrawAction(isLedger);
    }, [isLedger]);

    const openMoreInfo = () => {
        const url = KnownPools(network.isTestnet)[targetPoolFriendly]?.webLink;

        if (!!url) {
            const domain = extractDomain(url);
            navigation.navigateDAppWebViewModal({
                lockNativeBack: true,
                safeMode: true,
                url,
                header: { title: { type: 'params', params: { domain } } },
                useStatusBar: true,
                engine: 'ton-connect',
                controlls: {
                    refresh: true,
                    share: true,
                    back: true,
                    forward: true
                }
            });
        }
    };

    const navigateToCurrencySettings = () => navigation.navigate('Currency');

    const stakeInfo = useMemo(() => {
        const amount = nominator?.balance || 0n;
        const balance = BigInt(amount);
        return {
            balance,
            hasStake: balance > 0n
        }
    }, [nominator?.balance]);

    // weird bug with status bar not changing color with component
    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle('light');
        }, 10);
    });

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style={'light'} />
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                    paddingHorizontal: 16
                }}
                collapsable={false}
            >
                <View style={{
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 6
                }}>
                    <View style={{ flex: 1 }}>
                        <BackButton
                            iconTintColor={theme.iconUnchangeable}
                            style={{ backgroundColor: theme.surfaceOnDark }}
                            onPress={navigation.goBack}
                        />
                    </View>
                    <View style={{ backgroundColor: theme.surfaceOnDark, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 32 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.medium17_24]}>
                            {KnownPools(network.isTestnet)[targetPoolFriendly]?.name}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                        <Pressable
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                                height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                                borderRadius: 16
                            })}
                            onPress={openMoreInfo}
                        >
                            <Image
                                source={require('@assets/ic-info.png')}
                                style={{
                                    height: 16,
                                    width: 16,
                                    tintColor: theme.iconUnchangeable
                                }}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
            <ScrollView
                style={{ flexBasis: 0 }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                contentInsetAdjustmentBehavior={"never"}
                automaticallyAdjustContentInsets={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
                overScrollMode={'never'}
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
                        backgroundColor: theme.backgroundUnchangeable
                    }}>
                        <Text style={[{ color: theme.textOnsurfaceOnDark }, Typography.semiBold32_38]}>
                            <ValueComponent
                                value={balance}
                                precision={4}
                                centFontStyle={{ opacity: 0.5 }}
                            />
                            <Text style={{ color: theme.textSecondary }}>{' TON'}</Text>
                        </Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginTop: 10, gap: 8
                        }}>
                            <Pressable
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={navigateToCurrencySettings}
                            >
                                <PriceComponent
                                    amount={balance}
                                    style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                    theme={theme}
                                />
                            </Pressable>
                            <View style={{
                                backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                                gap: 6,
                                padding: 2, paddingRight: 12,
                                borderRadius: 24,
                                flexDirection: 'row', alignItems: 'center'
                            }}>
                                <Image
                                    style={{ height: 24, width: 24 }}
                                    source={require('@assets/ic-profit.png')}
                                />
                                <Text style={[{ color: theme.textUnchangeable }, Typography.medium15_20]}>
                                    {apyWithFee}
                                </Text>
                            </View>
                        </View>
                        <WalletAddress
                            value={targetPool.toString({ testOnly: network.isTestnet })}
                            address={targetPool}
                            elipsise={{ start: 4, end: 5 }}
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
                            limitActions
                            disableContextMenu
                            copyOnPress
                            copyToastProps={{ marginBottom: bottomBarHeight + 16 }}
                            theme={theme}
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
                                marginBottom: 16, marginTop: 32,
                                padding: 20
                            }}
                            collapsable={false}
                        >
                            <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
                                <Pressable
                                    onPress={onTopUp}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
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
                                    disabled={!stakeInfo.hasStake}
                                    style={({ pressed }) => ({
                                        opacity: (!stakeInfo.hasStake || pressed) ? 0.5 : 1,
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
                                            <Image source={require('@assets/ic-minus.png')} />
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
                                    onPress={() => navigation.navigateStakingCalculator({ target: targetPoolFriendly })}
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
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        <StakingCycle
                            stakeUntil={stakeUntil}
                            locked={true}
                            style={{ marginBottom: 16 }}
                        />
                        {!!pendingPoolTxs && pendingPoolTxs.length > 0 && (
                            <PendingTransactionsList
                                theme={theme}
                                txs={pendingPoolTxs}
                                style={{ marginBottom: 16 }}
                                owner={memberAddress!.toString({ testOnly: network.isTestnet })}
                            />
                        )}
                        {/* TODO */}
                        {!!memberAddress && (
                            <LiquidStakingPendingComponent
                                member={memberAddress}
                                style={{ marginBottom: 16 }}
                                isLedger={isLedger}
                            />
                        )}
                        <LiquidStakingMember
                            balance={stakeInfo.balance}
                            rateWithdraw={liquidStaking?.rateWithdraw ?? 0n}
                        />
                        {__DEV__ && (
                            <StakingAnalyticsComponent pool={targetPool} />
                        )}
                    </View>
                </View>
                <View style={Platform.select({ android: { height: safeArea.bottom + 186 } })} />
            </ScrollView>
        </View>
    );
});

