import React, { memo, useMemo } from "react"
import { View, Text, StyleProp, TextStyle, ViewStyle } from "react-native";
import { t } from "../../i18n/t";
import { bnIsLess } from "../../utils/bnComparison";
import { parseAmountToNumber, toFixedBN } from "../../utils/parseAmount";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { ThemeType } from "../../engine/state/theme";
import { useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPoolMember, StakingPoolState } from "../../engine/types";
import { fromNano, toNano } from "@ton/core";

const priceTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;
const priceViewStyle = (theme: ThemeType) => ({ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }) as StyleProp<ViewStyle>;
const itemTitleTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;
const itemValueTextStyle = (theme: ThemeType) => ({ color: theme.textPrimary, fontSize: 17, fontWeight: '400' }) as StyleProp<TextStyle>;

export const StakingCalcComponent = memo((
    {
        amount,
        topUp,
        member,
        pool
    }: {
        amount: string,
        topUp?: boolean,
        member?: StakingPoolMember | null,
        pool: StakingPoolState
    }) => {
    const theme = useTheme();
    const apy = useStakingApy()?.apy;
    const poolFee = pool.params.poolFee ? Number(toNano(fromNano(pool.params.poolFee))) / 100 : undefined;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)) / 100;
        }
    }, [apy, poolFee]);

    if (topUp && member) {

        const yearly = toFixedBN(parseAmountToNumber(fromNano(member.balance)) * (apyWithFee ? apyWithFee : 0.1));
        const yearlyPlus = yearly + (toFixedBN(parseAmountToNumber(amount) * (apyWithFee ? apyWithFee : 0.1)));
        return (
            <View style={{ backgroundColor: theme.surfaceSecondary, padding: 20, borderRadius: 20 }}>
                <View style={{
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Text style={itemTitleTextStyle(theme)}>
                            {t('products.staking.calc.yearlyCurrent')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 17,
                                color: theme.textPrimary
                            }}>
                                {'≈ '}
                                <ValueComponent precision={2} value={yearly} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={yearly}
                                style={priceViewStyle(theme)}
                                textStyle={priceTextStyle(theme)}
                            />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: theme.divider,
                        marginVertical: 16
                    }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Text style={itemTitleTextStyle(theme)}>
                            {t('products.staking.calc.yearlyTopUp')}
                        </Text>
                        <View>
                            {(yearlyPlus === 0n || yearlyPlus > (toNano('100000000000000'))) ? (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: theme.accentGreen
                                    }}>
                                        {'...'}
                                    </Text>
                                    <Text style={{
                                        color: theme.textSecondary,
                                        fontWeight: '400',
                                        fontSize: 14,
                                        paddingHorizontal: 0,
                                        paddingVertical: 2,
                                        alignSelf: 'flex-end'
                                    }}>
                                        {'...'}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: theme.accentGreen
                                    }}>
                                        {'≈ '}
                                        <ValueComponent precision={2} value={yearlyPlus} />
                                        {' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={yearlyPlus}
                                        style={priceViewStyle(theme)}
                                        textStyle={priceTextStyle(theme)}
                                    />
                                </>
                            )
                            }
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    const parsed = parseAmountToNumber(amount);
    const yearly = toFixedBN(parsed * (apyWithFee ? apyWithFee : 0.1));
    const monthly = toFixedBN(parsed * (Math.pow((1 + (apyWithFee ? apyWithFee : 0.1) / 366), 30)) - parsed);
    const daily = toFixedBN(parsed * (1 + (apyWithFee ? apyWithFee : 0.1) / 366) - parsed)

    return (
        <View style={{
            backgroundColor: theme.surfaceSecondary,
            padding: 20,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={itemTitleTextStyle(theme)}>
                    {t('products.staking.calc.yearly')}
                </Text>
                <View>
                    <Text style={itemValueTextStyle(theme)}>
                        {'≈ '}
                        <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={yearly} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={yearly}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                    />
                </View>
            </View>
            <View style={{
                height: 1, width: '100%',
                backgroundColor: theme.divider,
                marginVertical: 16
            }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={itemTitleTextStyle(theme)}>
                    {t('products.staking.calc.monthly')}
                </Text>
                <View>
                    <Text style={itemValueTextStyle(theme)}>
                        {'≈ '}
                        <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={monthly} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={monthly}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                    />
                </View>
            </View>
            <View style={{
                height: 1, width: '100%',
                backgroundColor: theme.divider,
                marginVertical: 16
            }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={itemTitleTextStyle(theme)}>
                    {t('products.staking.calc.daily')}
                </Text>
                <View>
                    <Text style={itemValueTextStyle(theme)}>
                        {'≈ '}
                        <ValueComponent precision={bnIsLess(daily, 0.01) ? 8 : 2} value={daily} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={daily}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                    />
                </View>
            </View>
            <View style={{
                borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: theme.background,
                width: '100%',
                justifyContent: 'center', alignItems: 'center',
                marginTop: 16
            }}>
                <Text style={{
                    color: theme.textSecondary,
                    fontSize: 15, fontWeight: '400',
                }}>
                    {t('products.staking.calc.note')}
                </Text>
            </View>
        </View>
    );
})