import BN from "bn.js";
import React, { useMemo } from "react"
import { View, Text } from "react-native"
import { fromNano, toNano } from "ton";
import { t } from "../../i18n/t";
import { StakingPoolState } from "../../engine/sync/startStakingPoolSync";
import { PriceComponent } from "../PriceComponent";
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";

export const PoolTransactionInfo = React.memo(({ pool, fee }: { pool: StakingPoolState, fee?: BN | null }) => {
    if (!pool) return null;
    const { Theme, AppConfig } = useAppConfig();
    const depositFee = pool.params.depositFee.add(pool.params.receiptPrice);
    const withdrawFee = pool.params.withdrawFee.add(pool.params.receiptPrice);
    const poolFee = pool.params.poolFee ? toNano(fromNano(pool.params.poolFee)).divn(100).toNumber() : undefined;
    const engine = useEngine();
    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)).toFixed(3)
        }
    }, [apy, poolFee]);


    return (
        <View style={{
            backgroundColor: Theme.item,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 16,
            marginTop: 20
        }}>
            {!!apyWithFee && (
                <>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 50
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: Theme.label
                        }}>
                            {t('products.staking.info.rateTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {`${apyWithFee}%`}
                        </Text>
                    </View>
                    <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                </>
            )}
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 50
            }}>
                <Text style={{
                    fontSize: 16,
                    color: Theme.label
                }}>
                    {t('products.staking.info.frequencyTitle')}
                </Text>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {t('products.staking.info.frequency')}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 50
            }}>
                <Text style={{
                    fontSize: 16,
                    color: Theme.label
                }}>
                    {t('products.staking.info.minDeposit')}
                </Text>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {fromNano(
                        pool.params.minStake
                            .add(pool.params.depositFee)
                            .add(pool.params.receiptPrice)
                    ) + ' TON'}
                </Text>
            </View>
            {!AppConfig.isTestnet && !!poolFee && (
                <>
                    <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 50
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: Theme.label
                        }}>
                            {t('products.staking.info.poolFeeTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {`${poolFee}%`}
                        </Text>
                    </View>
                </>
            )}
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 55
            }}>
                <Text style={{
                    fontSize: 16,
                    color: Theme.label
                }}>
                    {t('products.staking.info.depositFee')}
                </Text>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                    }}>
                        {fromNano(depositFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: Theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: Theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 55
            }}>
                <Text style={{
                    fontSize: 16,
                    color: Theme.label
                }}>
                    {t('products.staking.info.withdrawRequestFee')}
                </Text>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                    }}>
                        {fromNano(withdrawFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: Theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: Theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                minHeight: 55
            }}>
                <View style={{ flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap' }}>
                    <Text style={{
                        fontSize: 16,
                        color: Theme.label,
                    }}>
                        {t('products.staking.info.withdrawCompleteFee')}
                    </Text>
                </View>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                    }}>
                        {fromNano(withdrawFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: Theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: Theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            {!!fee && (
                <>
                    <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 55,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: Theme.label
                        }}>
                            {t('products.staking.info.blockchainFee')}
                        </Text>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {fee ? fromNano(fee) + ' ' + 'TON' : '...'}
                            </Text>
                            {fee && (
                                <PriceComponent
                                    amount={fee}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: Theme.priceSecondary, fontWeight: '400' }}
                                />
                            )}
                        </View>
                    </View>
                </>
            )}
        </View>
    );
});