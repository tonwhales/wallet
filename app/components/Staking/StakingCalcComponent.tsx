import BN from "bn.js";
import React from "react"
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";

export const StakingCalcComponent = React.memo(({ amount }: { amount: BN }) => {
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
                    {t('products.staking.calc.yearly')}
                </Text>
                <View>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        color: '#4FAE42'
                    }}>
                        {fromNano(amount) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={amount}
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
                    {t('products.staking.calc.monthly')}
                </Text>
                <View>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        color: '#4FAE42'
                    }}>
                        {fromNano(amount) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={amount}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0,
                            alignSelf: 'flex-end'
                        }}
                        textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                    />
                </View>
            </View>
            <View style={{ height: 1, width: '100%', backgroundColor: Theme.divider, marginLeft: 4, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
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
                        {fromNano(amount) + ' ' + 'TON'}
                    </Text>
                    <PriceComponent
                        amount={amount}
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
    );
})