import React, { memo, useMemo } from "react"
import { View, Text, StyleProp, TextStyle, ViewStyle } from "react-native";
import { t } from "../../i18n/t";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { ThemeType } from "../../engine/state/theme";
import { usePoolApy, useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPoolMember } from "../../engine/types";
import { fromNano, toNano } from "@ton/core";

const priceTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;
const priceViewStyle = (theme: ThemeType) => ({ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }) as StyleProp<ViewStyle>;
const itemTitleTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;
const itemValueTextStyle = (theme: ThemeType) => ({ color: theme.textPrimary, fontSize: 17, fontWeight: '400' }) as StyleProp<TextStyle>;

export const StakingCalcComponent = memo((
    {
        poolAddressString,
        amount,
        topUp,
        member,
        fee
    }: {
        poolAddressString: string,
        amount: bigint,
        topUp?: boolean,
        member?: StakingPoolMember | null,
        fee: bigint
    }) => {
    const theme = useTheme();
    const poolApy = usePoolApy(poolAddressString);
    const apy = useStakingApy()?.apy;
    
    const poolFee = fee / 100n;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            try {
                const poolFeeNum = Number(poolFee);
                const apyNum = Number(apy);
                const abs = apyNum - apyNum * (poolFeeNum / 100);
                return Number((abs / 100).toFixed(4));
            } catch {
                return 0.1;
            }
        }
        return 0.1;
    }, [apy, poolFee]);

    if (topUp && member) {

        const yearly = Number(fromNano(member.balance)) * apyWithFee;
        const yearlyPlus = yearly + (Number(fromNano(amount)) * apyWithFee);

        return (
            <View style={{ backgroundColor: theme.surfaceOnElevation, padding: 20, borderRadius: 20 }}>
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
                                <ValueComponent precision={2} value={toNano(yearly.toFixed(3))} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={toNano(yearly.toFixed(3))}
                                style={priceViewStyle(theme)}
                                textStyle={priceTextStyle(theme)}
                                theme={theme}
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
                            {yearlyPlus === 0 ? (
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
                                        <ValueComponent precision={2} value={toNano(yearlyPlus.toFixed(3))} />
                                        {' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={toNano(yearlyPlus.toFixed(3))}
                                        style={priceViewStyle(theme)}
                                        textStyle={priceTextStyle(theme)}
                                        theme={theme}
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

    const amountNum = Number(fromNano(amount));
    const yearly = amountNum * apyWithFee;
    const monthly = amountNum * (Math.pow((1 + apyWithFee / 366), 30)) - amountNum;
    const daily = amountNum * (1 + apyWithFee / 366) - amountNum;

    return (
        <View style={{
            backgroundColor: theme.surfaceOnElevation,
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
                        <ValueComponent precision={monthly < 0.01 ? 8 : 2} value={toNano(yearly.toFixed(3))} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={toNano(yearly.toFixed(3))}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                        theme={theme}
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
                        <ValueComponent precision={monthly < 0.01 ? 8 : 2} value={toNano(monthly.toFixed(3))} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={toNano(monthly.toFixed(3))}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                        theme={theme}
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
                        <ValueComponent precision={daily < 0.01 ? 8 : 2} value={toNano(daily.toFixed(3))} />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={toNano(daily.toFixed(3))}
                        style={priceViewStyle(theme)}
                        textStyle={priceTextStyle(theme)}
                        theme={theme}
                    />
                </View>
            </View>
            <View style={{
                borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: theme.backgroundPrimary,
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