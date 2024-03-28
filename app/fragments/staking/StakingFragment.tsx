import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Platform, Image, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/address/WalletAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingCycle } from "../../components/staking/StakingCycle";
import { StakingPendingComponent } from "../../components/staking/StakingPendingComponent";
import { useParams } from "../../utils/useParams";
import { TransferAction } from "./StakingTransferFragment";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { RestrictedPoolBanner } from "../../components/staking/RestrictedPoolBanner";
import { KnownPools } from "../../utils/KnownPools";
import { StakingPoolType } from "./StakingPoolsFragment";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { StakingAnalyticsComponent } from "../../components/staking/StakingAnalyticsComponent";
import { useNetwork, usePendingTransactions, useSelectedAccount, useStakingActive, useStakingPool, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, toNano } from "@ton/core";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PendingTransactionsView } from "../wallet/views/PendingTransactions";
import { StakingPoolHeader } from "../../components/staking/StakingPoolHeader";
import { Typography } from "../../components/styles";

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
        navigation.navigateStakingTransfer(
            {
                target: targetPool,
                amount: transferAmount,
                lockAddress: true,
                lockComment: true,
                action: 'top_up' as TransferAction,
            }, 
            isLedger
        );
    }, [targetPool, transferAmount, isLedger]);

    const onUnstake = useCallback(() => {
        navigation.navigateStakingTransfer(
            {
                target: targetPool,
                lockAddress: true,
                lockComment: true,
                action: 'withdraw' as TransferAction,
            },
            isLedger
        );
    }, [targetPool, isLedger]);

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    const hasStake = (member?.balance || 0n)
        + (member?.pendingWithdraw || 0n)
        + (member?.pendingDeposit || 0n)
        + (member?.withdraw || 0n)
        > 0n;

    // weird bug with status bar not changing color with component
    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle('light');
        }, 10);
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={'light'} />
            <StakingPoolHeader
                isLedger={false}
                currentPool={targetPool}
                setParams={setParams}
            />
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
                                value={member?.balance || 0n}
                                precision={4}
                                centFontStyle={{ opacity: 0.5 }}
                            />
                            <Text style={{ color: theme.textSecondary }}>{' TON'}</Text>
                        </Text>
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
                                    style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                    theme={theme}
                                />
                                <PriceComponent
                                    showSign
                                    amount={toNano(1)}
                                    style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg, marginLeft: 8 }}
                                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                    theme={theme}
                                />
                            </Pressable>
                        </View>
                        <WalletAddress
                            value={targetPool.toString({ testOnly: network.isTestnet })}
                            address={targetPool}
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
                            limitActions
                            disableContextMenu
                            copyOnPress
                            copyToastProps={{ marginBottom: bottomBarHeight + 16 }}
                            bounceable={true}
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
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
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
                            isLedger={isLedger}
                        />
                        {(type !== 'nominators' && !available) && (
                            <RestrictedPoolBanner type={type} />
                        )}
                        {network.isTestnet && (
                            <RestrictedPoolBanner type={'team'} />
                        )}
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

