import BN from "bn.js";
import React, { useMemo } from "react"
import { View, Text, StyleProp, TextStyle, ViewStyle } from "react-native";
import { fromNano, toNano } from "ton";
import { useEngine } from "../../engine/Engine";
import { StakingPoolState } from "../../engine/sync/startStakingPoolSync";
import { t } from "../../i18n/t";
import { bnIsLess } from "../../utils/bnComparison";
import { parseAmountToNumber, toFixedBN } from "../../utils/parseAmount";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ThemeType } from "../../utils/Theme";

const priceTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;
const priceViewStyle = (theme: ThemeType) => ({ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }) as StyleProp<ViewStyle>;
const itemTitleTextStyle = (theme: ThemeType) => ({ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }) as StyleProp<TextStyle>;

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
    const { Theme } = useAppConfig();
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
            <View style={{ backgroundColor: Theme.surfaceSecondary, padding: 20, borderRadius: 20 }}>
                <View style={{
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Text style={itemTitleTextStyle(Theme)}>
                            {t('products.staking.calc.yearlyCurrent')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 17,
                                color: Theme.textPrimary
                            }}>
                                {'≈ '}
                                <ValueComponent precision={2} value={yearly} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={yearly}
                                style={priceViewStyle(Theme)}
                                textStyle={priceTextStyle(Theme)}
                            />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: Theme.divider,
                        marginVertical: 16
                    }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Text style={itemTitleTextStyle(Theme)}>
                            {t('products.staking.calc.yearlyTopUp')}
                        </Text>
                        <View>
                            {(yearlyPlus.eq(new BN(0)) || yearlyPlus.gt(toNano('100000000000000'))) && (
                                <>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: Theme.accentGreen
                                    }}>
                                        {'...'}
                                    </Text>
                                    <Text style={{
                                        color: Theme.textSecondary,
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
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 16,
                                        color: Theme.accentGreen
                                    }}>
                                        {'≈ '}
                                        <ValueComponent precision={2} value={yearlyPlus} />
                                        {' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={yearlyPlus}
                                        style={priceViewStyle(Theme)}
                                        textStyle={priceTextStyle(Theme)}
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
        <View style={{}}>
            <View style={{
                backgroundColor: Theme.surfaceSecondary,
                padding: 16,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginVertical: 14
            }}>
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    height: 56
                }}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.calc.yearly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: Theme.accentGreen
                        }}>
                            {'≈ '}
                            <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={yearly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={yearly}
                            style={priceViewStyle(Theme)}
                            textStyle={priceTextStyle(Theme)}
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
                    height: 56
                }}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.calc.monthly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: Theme.accentGreen
                        }}>
                            {'≈ '}
                            <ValueComponent precision={bnIsLess(monthly, 0.01) ? 8 : 2} value={monthly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={monthly}
                            style={priceViewStyle(Theme)}
                            textStyle={priceTextStyle(Theme)}
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
                    height: 56
                }}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.calc.daily')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: Theme.accentGreen
                        }}>
                            {'≈ '}
                            <ValueComponent precision={bnIsLess(daily, 0.01) ? 8 : 2} value={daily} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={daily}
                            style={priceViewStyle(Theme)}
                            textStyle={priceTextStyle(Theme)}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
})