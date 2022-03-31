import BN from "bn.js";
import React from "react"
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { fromNano, toNano } from "ton";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";

export const StakingCalcComponent = React.memo(({ amount }: { amount: string }) => {
    const { t } = useTranslation();

    const yearly = toNano(parseFloat(amount.replace(',', '.'))).muln(0.133);
    const monthly = toNano(parseFloat(amount.replace(',', '.'))).muln(0.133).muln(30 / 366);
    const daily = toNano(parseFloat(amount.replace(',', '.'))).muln(0.133).muln(1 / 366);

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
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {fromNano(yearly) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={yearly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
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
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {fromNano(monthly) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={monthly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
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
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {fromNano(daily) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={daily}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
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