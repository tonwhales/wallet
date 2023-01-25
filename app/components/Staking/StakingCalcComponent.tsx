import BN from "bn.js";
import React, { useMemo } from "react"
import { View, Text } from "react-native";
import { fromNano, toNano } from "ton";
import { useEngine } from "../../engine/Engine";
import { StakingPoolState } from "../../engine/sync/startStakingPoolSync";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { bnIsLess } from "../../utils/bnComparison";
import { parseAmountToNumber, toFixedBN } from "../../utils/parseAmount";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";

export const StakingCalcComponent = React.memo((
    {
        amount,
        topUp,
        member,
        pool
    }: {
        amount: string,
        topUp?: boolean,
        member?: {
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        } | null,
        pool: StakingPoolState
    }) => {
    const engine = useEngine();
    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const poolFee = pool.params.poolFee ? toNano(fromNano(pool.params.poolFee)).divn(100).toNumber() : undefined;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)) / 100;
        }
    }, [apy, poolFee]);

    if (topUp && member) {

        const yearly = toFixedBN(parseAmountToNumber(fromNano(member.balance)) * (apyWithFee ? apyWithFee : 0.1));
        const yearlyPlus = yearly.add(toFixedBN(parseAmountToNumber(amount) * (apyWithFee ? apyWithFee : 0.1)));
        return (
            <>
                <Text style={{
                    fontSize: 16,
                    color: Theme.textColor,
                    fontWeight: '600',
                    marginTop: 20
                }}>
                    {t('products.staking.calc.topUpTitle')}
                </Text>
                <View style={{
                    backgroundColor: 'white',
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
                            color: '#7D858A',
                        }}>
                            {t('products.staking.calc.yearlyCurrent')}
                        </Text>
                        <View>
                            <ValueComponent
                                prefix={'~'}
                                style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    color: Theme.textColor
                                }}
                                precision={2}
                                value={yearly}
                                suffix={' TON'}
                            />
                            <PriceComponent
                                amount={yearly}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 2,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                            />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: Theme.divider,
                    }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A'
                        }}>
                            {t('products.staking.calc.yearlyTopUp')}
                        </Text>
                        <View>
                            {(yearlyPlus.eq(new BN(0)) || yearlyPlus.gt(toNano('100000000000000'))) && (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: '#4FAE42'
                                    }}>
                                        {'...'}
                                    </Text>
                                    <Text style={{
                                        color: '#6D6D71',
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
                            {!yearlyPlus.eq(new BN(0)) && yearlyPlus.lt(toNano('100000000000000')) && (
                                <>
                                    <ValueComponent
                                        style={{
                                            fontWeight: '600',
                                            fontSize: 16,
                                            color: '#4FAE42'
                                        }}
                                        precision={2}
                                        value={yearlyPlus}
                                        suffix={' TON'}
                                        prefix={'~'}
                                    />
                                    <PriceComponent
                                        amount={yearlyPlus}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 2,
                                            alignSelf: 'flex-end'
                                        }}
                                        textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                                    />
                                </>
                            )}
                        </View>
                    </View>
                </View>
                <Text style={{
                    color: '#8E979D',
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
                backgroundColor: 'white',
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
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.yearly')}
                    </Text>
                    <View>
                        <ValueComponent
                            precision={bnIsLess(monthly, 0.01) ? 8 : 2}
                            value={yearly}
                            style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}
                            prefix={'~'}
                            suffix={' TON'}
                        />
                        <PriceComponent
                            amount={yearly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: Theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.monthly')}
                    </Text>
                    <View>
                        <ValueComponent
                            precision={bnIsLess(monthly, 0.01) ? 8 : 2}
                            value={monthly}
                            style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}
                            prefix={'~'}
                            suffix={' TON'}
                        />
                        <PriceComponent
                            amount={monthly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: Theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.daily')}
                    </Text>
                    <View>
                        <ValueComponent
                            precision={bnIsLess(daily, 0.01) ? 8 : 2}
                            value={daily}
                            style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}
                            prefix={'~'}
                            suffix={' TON'}
                        />
                        <PriceComponent
                            amount={daily}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
            </View>
            <Text style={{
                color: '#8E979D',
                marginTop: -4,
                fontSize: 13,
                fontWeight: '400'
            }}>
                {t('products.staking.calc.note')}
            </Text>
        </>
    );
})