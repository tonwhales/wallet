import React, { memo, useMemo } from "react"
import { View, Text } from "react-native";
import { fromNano, toNano } from "@ton/core";
import { t } from "../../i18n/t";
import { bnIsLess } from "../../utils/bnComparison";
import { parseAmountToNumber, toFixedBN } from "../../utils/parseAmount";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { useTheme } from '../../engine/hooks';
import { useStakingApy } from '../../engine/hooks';
import { StakingPoolState } from '../../engine/types';

export const StakingCalcComponent = memo((
    {
        amount,
        topUp,
        pool
    }: {
        amount: string,
        topUp?: boolean,
        pool: StakingPoolState
    }) => {
    const theme = useTheme();
    const apy = useStakingApy()?.apy;
    const member = pool.member;
    const poolFee = pool.params?.poolFee ? Number(pool.params.poolFee / 100n) : undefined;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)) / 100;
        }
    }, [apy, poolFee]);

    if (topUp && member) {

        const yearly = toFixedBN(parseAmountToNumber(fromNano(member.balance)) * (apyWithFee ? apyWithFee : 0.1));
        const yearlyPlus = yearly + toFixedBN(parseAmountToNumber(amount) * (apyWithFee ? apyWithFee : 0.1));
        return (
            <>
                <Text style={{
                    fontSize: 16,
                    color: theme.textColor,
                    fontWeight: '600',
                    marginTop: 20
                }}>
                    {t('products.staking.calc.topUpTitle')}
                </Text>
                <View style={{
                    backgroundColor: theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingLeft: 16,
                    marginVertical: 10
                }}>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: theme.label,
                        }}>
                            {t('products.staking.calc.yearlyCurrent')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: theme.textColor
                            }}>
                                {'~'}
                                <ValueComponent precision={2} value={yearly} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={yearly}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 2,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                            />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: theme.divider,
                    }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: theme.label
                        }}>
                            {t('products.staking.calc.yearlyTopUp')}
                        </Text>
                        <View>
                            {(yearlyPlus === 0n || yearlyPlus > toNano('100000000000000')) && (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: theme.pricePositive
                                    }}>
                                        {'...'}
                                    </Text>
                                    <Text style={{
                                        color: theme.priceSecondary,
                                        fontWeight: '400',
                                        fontSize: 14,
                                        paddingHorizontal: 0,
                                        paddingVertical: 2,
                                        alignSelf: 'flex-end'
                                    }}>
                                        {'...'}
                                    </Text>
                                </>
                            )}
                            {yearlyPlus !== 0n && yearlyPlus < toNano('100000000000000') && (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: theme.pricePositive
                                    }}>
                                        {'~'}
                                        <ValueComponent precision={2} value={yearlyPlus} />
                                        {' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={yearlyPlus}
                                        style={{
                                            backgroundColor: theme.transparent,
                                            paddingHorizontal: 0, paddingVertical: 2,
                                            alignSelf: 'flex-end'
                                        }}
                                        textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                                    />
                                </>
                            )
                            }
                        </View>
                    </View>
                </View>
                <Text style={{
                    color: theme.textSubtitle,
                    marginTop: -4,
                    fontSize: 13,
                    fontWeight: '400'
                }}>
                    {t('products.staking.calc.note')}
                </Text>
            </>
        )
    }

    const parsed = parseAmountToNumber(amount);
    const yearly = toFixedBN(parsed * (apyWithFee ? apyWithFee : 0.1));
    const monthly = toFixedBN(parsed * (Math.pow((1 + (apyWithFee ? apyWithFee : 0.1) / 366), 30)) - parsed);
    const daily = toFixedBN(parsed * (1 + (apyWithFee ? apyWithFee : 0.1) / 366) - parsed)

    return (
        <>
            <View style={{
                backgroundColor: theme.item,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: 16,
                marginVertical: 14
            }}>
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: theme.label
                    }}>
                        {t('products.staking.calc.yearly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: theme.pricePositive
                        }}>
                            {'~'}
                            <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={yearly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={yearly}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: theme.label
                    }}>
                        {t('products.staking.calc.monthly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: theme.pricePositive
                        }}>
                            {'~'}
                            <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={monthly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={monthly}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: theme.label
                    }}>
                        {t('products.staking.calc.daily')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: theme.pricePositive
                        }}>
                            {'~'}
                            <ValueComponent precision={bnIsLess(daily, 0.01) ? 8 : 2} value={daily} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={daily}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
            </View>
            <Text style={{
                color: theme.textSubtitle,
                marginTop: -4,
                fontSize: 13,
                fontWeight: '400'
            }}>
                {t('products.staking.calc.note')}
            </Text>
        </>
    );
})