import BN from "bn.js"
import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { fromNano } from "ton"
import { usePrice } from "../engine/PriceContext"
import { formatCurrency } from "../utils/formatCurrency"
import { useAppConfig } from "../utils/AppConfigContext"

import TonSign from '../../assets/ic_ton_sign.svg';

export const PriceComponent = React.memo((
    {
        amount,
        style,
        textStyle,
        prefix,
        suffix,
        currencyCode,
        showSign
    }: {
        amount: BN,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string,
        currencyCode?: string,
        showSign?: boolean
    }
) => {
    const { Theme } = useAppConfig();
    const [price, currency] = usePrice();

    if (!price) {
        return <></>;
    }

    return (
        <View style={[{
            backgroundColor: Theme.accent,
            borderRadius: 16,
            height: 28,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingVertical: 4,
            paddingHorizontal: 12,
            paddingLeft: showSign ? 4 : 12
        }, style]}>
            {showSign && (
                <View style={{
                    height: 22, width: 22,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: '#1678EA', borderRadius: 12,
                    marginRight: 6
                }}>
                    <TonSign
                        height={12}
                        width={12}
                        style={{ marginTop: 2, height: 12, width: 12 }}
                    />
                </View>
            )}
            <Text style={[{
                color: Theme.surfacePimary,
                fontSize: 15, fontWeight: '500',
                textAlign: "center",
                lineHeight: 20
            }, textStyle]}>
                {`${prefix ?? ''}${formatCurrency((parseFloat(fromNano(amount.abs())) * price.price.usd * price.price.rates[currencyCode || currency]).toFixed(2), currencyCode || currency, amount.isNeg())}${suffix ?? ''}`}
            </Text>
        </View>
    )
})