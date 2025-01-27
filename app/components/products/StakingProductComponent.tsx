import React, { memo, ReactNode, useCallback, useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { useStakingActive, useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPool } from "../staking/StakingPool";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Address } from "@ton/core";
import { LiquidStakingPool } from "../staking/LiquidStakingPool";
import { useLiquidStakingBalance } from "../../engine/hooks/staking/useLiquidStakingBalance";

import StakingIcon from '@assets/ic-staking.svg';

type ProductItem =
    { type: 'active', address: Address, balance: bigint }
    | { type: 'liquid' }
    | { type: 'banner' };

const style: StyleProp<ViewStyle> = {
    height: 86,
    borderRadius: 20,
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

export const StakingProductComponent = memo(({ address, isLedger }: { address: Address, isLedger?: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const active = useStakingActive(address);
    const activeArray = useMemo(() => {
        if (!active) {
            return [];
        }

        return Object.keys(active).filter((k) => active[k].balance > 0n).map((key) => {
            const state = active[key];
            return {
                type: "active" as const,
                address: Address.parse(key),
                balance: state.balance
            };
        });
    }, [active]);
    const liquidBalance = useLiquidStakingBalance(address);

    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const totalBalance = useMemo(() => {
        return liquidBalance + activeArray.reduce((acc, item) => {
            return acc + item?.balance || 0n;
        }, 0n);
    }, [active, liquidBalance]);

    const renderItem = useCallback((p: ProductItem) => {
        if (!p) {
            return null;
        }

        if (p.type === 'liquid') {
            return (
                <LiquidStakingPool
                    member={address}
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
                member={address}
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
    }, [theme, address, isLedger, apyWithFee]);

    if (!address) {
        return null;
    }

    const items: ProductItem[] = activeArray;
    let action: ReactNode | undefined = undefined;

    if (liquidBalance > 0n) {
        items.push({ type: 'liquid' });
    }

    if (items.length === 0) {
        items.push({ type: 'banner' });
    } else {
        action = (
            <Pressable
                style={({ pressed }) => (
                    {
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        padding: 16,
                        opacity: pressed ? 0.5 : 1
                    }
                )}
                onPress={() => navigation.navigate('StakingPools')}
            >
                <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                    {t('products.addNew')}
                </Text>
            </Pressable>
        );
    }

    const renderFace = useCallback(() => {
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
                <View style={{ flexShrink: 1 }}>
                    <PerfText
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
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
                            theme={theme}
                        />
                    </View>
                )}
            </View>
        )
    }, [totalBalance, theme]);

    return (
        <View style={{ marginBottom: 16 }}>
            <CollapsibleCards
                title={t('products.staking.earnings')}
                items={items}
                renderItem={renderItem}
                theme={theme}
                renderFace={renderFace}
                action={action}
                itemHeight={86}
            />
        </View>
    );
})