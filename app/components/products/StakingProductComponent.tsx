import React, { memo, useCallback, useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useStakingActive, useTheme } from "../../engine/hooks";
import { StakingPool } from "../staking/StakingPool";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Address } from "@ton/core";
import { LiquidStakingPool } from "../staking/LiquidStakingPool";
import { useLiquidStakingBalance } from "../../engine/hooks/staking/useLiquidStakingBalance";
import { StakingProductBanner } from "./StakingProductBanner";
import { LiquidUSDeStakingMember } from "../staking/LiquidUSDeStakingMember";

import StakingIcon from '@assets/ic-staking.svg';
import { LiquidUSDeStakingPool } from "../staking/LiquidUSDeStakingPool";

type ProductItem =
    { type: 'active', address: Address, balance: bigint }
    | { type: 'liquid' }
    | { type: 'banner' }
    | { type: 'liquid-usde' };

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

const AddStakeButton = memo(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    return (
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Pressable
                style={({ pressed }) => (
                    {
                        opacity: pressed ? 0.5 : 1
                    }
                )}
                onPress={() => navigation.navigate('StakingPools')}
            >
                <Text numberOfLines={1} ellipsizeMode="tail" style={[{ color: theme.accent }, Typography.medium15_20]}>
                    {t('products.addNew')}
                </Text>
            </Pressable>
        </View>
    )
});

export const StakingProductComponent = memo(({ address, isLedger }: { address: Address, isLedger?: boolean }) => {
    const theme = useTheme();
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
    const liquidUsdeBalance = useLiquidUSDeStakingMember(address)?.balance || 0n;
    const liquidUsdeRate = useLiquidUSDeStakingRate();

    const totalBalance = useMemo(() => {
        return liquidBalance + activeArray.reduce((acc, item) => {
            return acc + (item?.balance || 0n);
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
                />
            )
        }

        if (p.type === 'liquid-usde') {
            return (
                <LiquidUSDeStakingPool
                    member={address}
                    hideHeader
                    iconBackgroundColor={theme.backgroundPrimary}
                    style={[{ height: 86, backgroundColor: theme.surfaceOnBg, marginVertical: 0, paddingHorizontal: 5 }]}
                />
            )
        }

        if (p.type === 'banner') {
            return (
                <StakingProductBanner isLedger={isLedger} />
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
    }, [theme, address, isLedger]);

    if (!address) {
        return null;
    }

    const items: ProductItem[] = activeArray;

    if (liquidBalance > 0n) {
        items.push({ type: 'liquid' });
    }

    if (liquidUsdeBalance > 0n) {
        items.push({ type: 'liquid-usde' });
    }

    if (items.length === 0) {
        items.push({ type: 'banner' });
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
                action={items.length ? <AddStakeButton /> : undefined}
                itemHeight={86}
            />
        </View>
    );
})