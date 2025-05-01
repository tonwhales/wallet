import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, Platform, Image, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { KnownPools } from "../../utils/KnownPools";
import { useFocusEffect } from "@react-navigation/native";
import { useIsLedgerRoute, useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useNetwork, usePendingActions, useSelectedAccount, useTheme, useUSDeAssetsShares } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address } from "@ton/core";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PendingTransactionsList } from "../wallet/views/PendingTransactions";
import { Typography } from "../../components/styles";
import { BackButton } from "../../components/navigation/BackButton";
import { LiquidStakingPendingComponent } from "../../components/staking/LiquidStakingPendingComponent";
import { WalletAddress } from "../../components/address/WalletAddress";
import { extractDomain } from "../../engine/utils/extractDomain";
import { LiquidUSDeStakingMember } from "../../components/staking/LiquidUSDeStakingMember";
import { useUSDeStakingApy } from "../../engine/hooks/staking/useUSDeStakingApy";
import { gettsUSDeMinter, getUSDeMinter } from "../../secure/KnownWallets";
import { fromBnWithDecimals } from "../../utils/withDecimals";

export const LiquidUSDeStakingFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const isLedger = useIsLedgerRoute();
    const selected = useSelectedAccount();
    const bottomBarHeight = useBottomTabBarHeight();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);
    const memberAddress = isLedger ? ledgerAddress : selected?.address;
    const nominator = useLiquidUSDeStakingMember(memberAddress);
    const usdeShares = useUSDeAssetsShares(memberAddress);
    const usdeApy = useUSDeStakingApy()?.apy;
    const rate = useLiquidUSDeStakingRate();
    const { state: pendingTxs, removePending } = usePendingActions(memberAddress!.toString({ testOnly: isTestnet }), isTestnet);

    const apyWithFee = useMemo(() => {
        if (!!usdeApy) {
            return `${t('common.apy')} ≈ ${usdeApy.toFixed(2)}%`;
        }
    }, [usdeApy]);

    const tsUSDe = nominator?.balance || 0n;
    const inUsde = tsUSDe * rate;
    const usdeDecimals = usdeShares?.usdeHint?.jetton.decimals ?? 9;

    const targets = useMemo(() => {
        const tsMinter = gettsUSDeMinter(isTestnet);
        const minter = getUSDeMinter(isTestnet);
        return [tsMinter, minter];
    }, [isTestnet]);

    const pendingPoolTxs = useMemo(() => {
        return pendingTxs.filter((tx) => {
            return targets.some((target) => tx.address?.equals(target));
        });
    }, [pendingTxs, targets]);

    useEffect(() => {
        // Remove transactions after 15 seconds of changing status
        setTimeout(() => {
            const toRemove = pendingPoolTxs
                .filter((tx) => tx.status !== 'pending')
                .map((tx) => tx.id);

            removePending(toRemove);
        }, 15 * 1000);
    }, [pendingPoolTxs]);

    const onTopUp = useCallback(() => {
        const balanceAmount = fromBnWithDecimals(usdeShares?.usdeHint?.balance || 0n, usdeDecimals);
        navigation.navigateLiquidUSDeStakingTransfer({ amount: balanceAmount, action: 'deposit' }, { ledger: isLedger });
    }, [isLedger]);

    const onUnstake = useCallback(() => {
        navigation.navigateLiquidUSDeStakingTransfer({ action: 'unstake' }, { ledger: isLedger });
    }, [isLedger]);

    const openMoreInfo = () => {
        const url = KnownPools(isTestnet)[targets[0].toString({ testOnly: isTestnet })]?.webLink;

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
                            {KnownPools(isTestnet)[targets[0].toString({ testOnly: isTestnet })]?.name}
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
                                value={inUsde}
                                precision={4}
                                centFontStyle={{ opacity: 0.5 }}
                                decimals={6}
                            />
                            <Text style={{ color: theme.textSecondary }}>{' USDe'}</Text>
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
                                    amount={inUsde * 1000n}
                                    style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                    theme={theme}
                                    priceUSD={1}
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
                            value={targets[0].toString({ testOnly: isTestnet })}
                            address={targets[0]}
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
                                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
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
                                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                                        >
                                            {t('products.staking.actions.withdraw')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                            <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
                                <Pressable
                                    onPress={() => navigation.navigateLiquidUSDeStakingCalculator(isLedger)}
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
                                        <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}>
                                            {t('products.staking.actions.calc')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        {!!pendingPoolTxs && pendingPoolTxs.length > 0 && (
                            <PendingTransactionsList
                                theme={theme}
                                txs={pendingPoolTxs}
                                style={{ marginBottom: 16 }}
                                owner={memberAddress!.toString({ testOnly: isTestnet })}
                            />
                        )}
                        {!!memberAddress && (
                            <LiquidStakingPendingComponent
                                member={memberAddress}
                                style={{ marginBottom: 16 }}
                                isLedger={isLedger}
                            />
                        )}
                        {!!memberAddress && (<LiquidUSDeStakingMember address={memberAddress} />)}
                    </View>
                </View>
                <View style={Platform.select({ android: { height: safeArea.bottom + 186 } })} />
            </ScrollView>
        </View>
    );
});

