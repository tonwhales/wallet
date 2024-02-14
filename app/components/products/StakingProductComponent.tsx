import React, { memo, useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { useLiquidStakingMember, useSelectedAccount, useStakingActive, useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPool } from "../staking/StakingPool";
import { ItemDivider } from "../ItemDivider";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { useLiquidStaking } from "../../engine/hooks/staking/useLiquidStaking";
import { Address, fromNano, toNano } from "@ton/core";
import { LiquidStakingPool } from "../staking/LiquidStakingPool";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";

import StakingIcon from '@assets/ic-staking.svg';

const style: StyleProp<ViewStyle> = {
    height: 84,
    borderRadius: 20,
    marginVertical: 4,
    padding: 20
}

const icStyle: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    marginRight: 12
}

const icStyleInner: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    borderRadius: 23,
    alignItems: 'center', justifyContent: 'center'
}

const titleStyle: StyleProp<TextStyle> = {
    fontSize: 17, fontWeight: '600',
    lineHeight: 24
}

const subtitleStyle: StyleProp<TextStyle> = {
    fontSize: 15, fontWeight: '400',
    lineHeight: 20
}

export const StakingProductComponent = memo(({ isLedger }: { isLedger?: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const selectedAccount = useSelectedAccount()?.address;

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const account = isLedger ? ledgerAddress : selectedAccount;

    const active = useStakingActive(account);
    const liquidStaking = useLiquidStaking().data;
    const liquidNominator = useLiquidStakingMember(account)?.data;

    const liquidBalance = useMemo(() => {
        const bal = fromNano(liquidNominator?.balance || 0n);
        const rate = fromNano(liquidStaking?.rateWithdraw || 0n);
        return toNano((parseFloat(bal) * parseFloat(rate)).toFixed(9));
    }, [liquidNominator?.balance, liquidStaking?.rateWithdraw]);

    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const totalBalance = useMemo(() => {
        return liquidBalance + active.reduce((acc, item) => {
            return acc + item.balance;
        }, 0n);
    }, [active, liquidBalance]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    if (!account) {
        return null;
    }

    if ((active.length + (liquidBalance > 0n ? 1 : 0)) >= 2) {
        return (
            <View style={{ marginBottom: 16 }}>
                <CollapsibleCards
                    title={t('products.staking.title')}
                    items={[...active, { type: 'banner' }, liquidBalance > 0n ? { type: 'liquid' } : null]}
                    renderItem={(p: any) => {
                        if (!p) {
                            return null
                        }

                        if (p.type === 'liquid') {
                            return (
                                <LiquidStakingPool
                                    member={account}
                                    style={[style, { padding: 0, backgroundColor: theme.surfaceOnBg, marginVertical: 0, paddingHorizontal: 5 }]}
                                    hideCycle
                                    hideHeader
                                    iconBackgroundColor={theme.backgroundPrimary}
                                    isLedger={isLedger}
                                />
                            )
                        }

                        if (p.type === 'banner') {
                            return (
                                <Pressable
                                    onPress={() => navigation.navigate(isLedger ? 'LedgerStakingPools' : 'StakingPools')}
                                    style={({ pressed }) => {
                                        return [style, { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg }]
                                    }}
                                >
                                    <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                                        <View style={icStyle}>
                                            <View style={{ backgroundColor: theme.accent, ...icStyleInner }}>
                                                <StakingIcon width={32} height={32} color={'white'} />
                                            </View>
                                        </View>
                                        <View style={{
                                            flexDirection: 'row',
                                            flexGrow: 1, flexShrink: 1, alignItems: 'center',
                                            justifyContent: 'space-between',
                                            overflow: 'hidden'
                                        }}>
                                            <View style={{ flexGrow: 1, flexShrink: 1 }}>
                                                <Text
                                                    style={{ color: theme.textPrimary, ...titleStyle }}
                                                    ellipsizeMode={'tail'}
                                                    numberOfLines={1}
                                                >
                                                    {t('products.staking.title')}
                                                </Text>
                                                <Text style={{ color: theme.textSecondary, ...subtitleStyle, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                                    {t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        }
                        return (
                            <StakingPool
                                member={account}
                                key={`active-${p.address.toString()}`}
                                pool={p.address}
                                balance={p.balance}
                                style={{
                                    backgroundColor: theme.surfaceOnBg,
                                    paddingHorizontal: 20
                                }}
                                iconBackgroundColor={theme.backgroundPrimary}
                                hideCycle
                                isLedger={isLedger}
                            />
                        )
                    }}
                    theme={theme}
                    renderFace={() => {
                        return (
                            <View style={[
                                {
                                    flexGrow: 1, flexDirection: 'row',
                                    padding: 20,
                                    marginHorizontal: 16,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    backgroundColor: theme.surfaceOnBg,
                                },
                                theme.style === 'dark' ? {
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 4,
                                } : {}
                            ]}>
                                <View style={icStyle}>
                                    <View style={{ backgroundColor: theme.accent, ...icStyleInner }}>
                                        <StakingIcon width={32} height={32} color={'white'} />
                                    </View>
                                </View>
                                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                    <PerfText
                                        style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                        ellipsizeMode="tail"
                                        numberOfLines={1}
                                    >
                                        {t('products.staking.title')}
                                    </PerfText>
                                    <PerfText
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                        style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                                    >
                                        <PerfText style={{ flexShrink: 1 }}>
                                            {t('common.showMore')}
                                        </PerfText>
                                    </PerfText>
                                </View>
                                {(!!totalBalance) && (
                                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                            <ValueComponent value={totalBalance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                                {' TON'}
                                            </Text>
                                        </Text>
                                        <PriceComponent
                                            amount={totalBalance}
                                            style={{
                                                backgroundColor: 'transparent',
                                                paddingHorizontal: 0, paddingVertical: 0,
                                                alignSelf: 'flex-end',
                                                height: undefined
                                            }}
                                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                            currencyCode={'EUR'}
                                            theme={theme}
                                        />
                                    </View>
                                )}
                            </View>
                        )
                    }}
                    itemHeight={86}
                />
            </View>
        );
    }

    return (
        <Animated.View style={animatedStyle}>
            <View style={{
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 20,
                marginHorizontal: 16,
                marginBottom: 16
            }}>
                {!!active && active.map((p, i) => (
                    <View key={`active-${p.address.toString()}`}>
                        <StakingPool
                            member={account}
                            pool={p.address}
                            balance={p.balance}
                            style={{
                                backgroundColor: theme.surfaceOnBg,
                                paddingHorizontal: 20
                            }}
                            hideCycle
                            iconBackgroundColor={theme.backgroundPrimary}
                            isLedger={isLedger}
                        />
                        <ItemDivider marginVertical={0} />
                    </View>
                ))}
                {liquidBalance > 0n && (
                    <>
                        <LiquidStakingPool
                            isLedger={isLedger}
                            member={account}
                            style={{ backgroundColor: theme.surfaceOnBg, paddingTop: 10 }}
                            hideCycle
                            hideHeader
                            iconBackgroundColor={theme.backgroundPrimary}
                        />
                        <ItemDivider marginVertical={0} />
                    </>
                )}
                <Pressable
                    onPress={() => navigation.navigate(isLedger ? 'LedgerStakingPools' : 'StakingPools')}
                    style={({ pressed }) => {
                        return [style, { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg }]
                    }}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                >
                    <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                        <View style={icStyle}>
                            <View style={{ backgroundColor: theme.accent, ...icStyleInner }}>
                                <StakingIcon width={32} height={32} color={'white'} />
                            </View>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            flexGrow: 1, flexShrink: 1, alignItems: 'center',
                            justifyContent: 'space-between',
                            overflow: 'hidden'
                        }}>
                            <View style={{ flexGrow: 1, flexShrink: 1 }}>
                                <Text
                                    style={{ color: theme.textPrimary, ...titleStyle }}
                                    ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                >
                                    {t('products.staking.title')}
                                </Text>
                                <Text style={{ color: theme.textSecondary, ...subtitleStyle, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                    {t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </View>
        </Animated.View>
    );
})