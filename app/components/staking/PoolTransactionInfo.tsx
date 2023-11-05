import BN from "bn.js";
import React, { useMemo } from "react"
import { View, Text } from "react-native"
import { fromNano, toNano } from "@ton/core";
import { t } from "../../i18n/t";
import { PriceComponent } from "../PriceComponent";
import { useStakingApy } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { StakingPoolState } from '../../engine/types';

export const PoolTransactionInfo = React.memo(({ pool, fee }: { pool: StakingPoolState, fee?: bigint | null }) => {
    if (!pool) return null;
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const depositFee = pool.params.depositFee + pool.params.receiptPrice;
    const withdrawFee = pool.params.withdrawFee + pool.params.receiptPrice;
    const poolFee = pool.params.poolFee ? Number(toNano(fromNano(pool.params.poolFee)) / 100n) : undefined;
    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)).toFixed(3)
        }
    }, [apy, poolFee]);


    return (
        <View style={{
            backgroundColor: theme.item,
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
                            color: theme.label
                        }}>
                            {t('products.staking.info.rateTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: theme.textColor
                        }}>
                            {`${apyWithFee}%`}
                        </Text>
                    </View>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
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
                    color: theme.label
                }}>
                    {t('products.staking.info.frequencyTitle')}
                </Text>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: theme.textColor
                }}>
                    {t('products.staking.info.frequency')}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 50
            }}>
                <Text style={{
                    fontSize: 16,
                    color: theme.label
                }}>
                    {t('products.staking.info.minDeposit')}
                </Text>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: theme.textColor
                }}>
                    {fromNano(
                        pool.params.minStake + pool.params.depositFee + pool.params.receiptPrice
                    ) + ' TON'}
                </Text>
            </View>
            {!isTestnet && !!poolFee && (
                <>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 50
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: theme.label
                        }}>
                            {t('products.staking.info.poolFeeTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: theme.textColor
                        }}>
                            {`${poolFee}%`}
                        </Text>
                    </View>
                </>
            )}
            <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 55
            }}>
                <Text style={{
                    fontSize: 16,
                    color: theme.label
                }}>
                    {t('products.staking.info.depositFee')}
                </Text>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: theme.textColor,
                    }}>
                        {fromNano(depositFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                height: 55
            }}>
                <Text style={{
                    fontSize: 16,
                    color: theme.label
                }}>
                    {t('products.staking.info.withdrawRequestFee')}
                </Text>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: theme.textColor,
                    }}>
                        {fromNano(withdrawFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                paddingRight: 16,
                minHeight: 55
            }}>
                <View style={{ flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap' }}>
                    <Text style={{
                        fontSize: 16,
                        color: theme.label,
                    }}>
                        {t('products.staking.info.withdrawCompleteFee')}
                    </Text>
                </View>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: theme.textColor,
                    }}>
                        {fromNano(withdrawFee) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={depositFee}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                    />
                </View>
            </View>
            {!!fee && (
                <>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme.divider, marginHorizontal: 4 }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 55,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: theme.label
                        }}>
                            {t('products.staking.info.blockchainFee')}
                        </Text>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: theme.textColor
                            }}>
                                {fee ? fromNano(fee) + ' ' + 'TON' : '...'}
                            </Text>
                            {fee ? (
                                <PriceComponent
                                    amount={fee}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                                />
                            ) : null}
                        </View>
                    </View>
                </>
            )}
        </View>
    );
});