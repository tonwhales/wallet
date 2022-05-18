import BN from "bn.js";
import React from "react"
import { View, Text } from "react-native"
import { fromNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";
import { StakingPoolState } from "../../engine/sync/StakingPoolSync";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";

export const PoolTransactionInfo = React.memo(({ pool, fee }: { pool: StakingPoolState, fee?: BN | null }) => {
    if (!pool) return null;
    const depositFee = pool.params.depositFee.add(pool.params.receiptPrice);

    return (
        <View style={{
            backgroundColor: 'white',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 16,
            marginTop: 20
        }}>
            {!AppConfig.isTestnet && (
                <>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 50
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A'
                        }}>
                            {t('products.staking.info.rateTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {t('products.staking.info.rate')}
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
                    color: '#7D858A'
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
                    color: '#7D858A'
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
            {!AppConfig.isTestnet && (
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
                            color: '#7D858A'
                        }}>
                            {t('products.staking.info.poolFeeTitle')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {t('products.staking.info.poolFee')}
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
                    color: '#7D858A'
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
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end',
                        }}
                        textStyle={{ color: '#6D6D71', fontWeight: '400' }}
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
                            color: '#7D858A'
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
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                                />
                            )}
                        </View>
                    </View>
                </>
            )}
        </View>
    );
});