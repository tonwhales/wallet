import BN from "bn.js";
import React from "react"
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native"
import { fromNano, toNano } from "ton";
import { StakingPoolState } from "../../storage/cache";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";

export const PoolTransactionInfo = React.memo(({ pool, fee }: { pool?: StakingPoolState | null, fee?: BN | null }) => {
    if (!pool) { return null; }
    const { t } = useTranslation();


    return (
        <View style={{
            backgroundColor: 'white',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 11,
            paddingLeft: 16,
            marginVertical: 14
        }}>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.rateTitle')}
                </Text>
                <Text style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {t('products.staking.info.rate')}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.frequencyTitle')}
                </Text>
                <Text style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {t('products.staking.info.frequency')}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.minDeposit')}
                </Text>
                <Text style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {fromNano(pool.minStake) + ' TON'}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.poolFeeTitle')}
                </Text>
                <Text style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: Theme.textColor
                }}>
                    {t('products.staking.info.poolFee')}
                </Text>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.depositFee')}
                </Text>
                <View>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        color: Theme.textColor
                    }}>
                        {fromNano(toNano(0.2)) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={toNano(0.2)}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end'
                        }}
                        textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <Text style={{
                    fontSize: 16,
                    color: '#7D858A'
                }}>
                    {t('products.staking.info.blockchainFee')}
                </Text>
                <View>
                    <Text style={{
                        fontWeight: '600',
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
        </View>
    );
});