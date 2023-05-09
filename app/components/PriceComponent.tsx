import BN from "bn.js"
import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { fromNano } from "ton"
import { usePrice } from "../engine/PriceContext"
import { formatCurrency } from "../utils/formatCurrency"
import { useAppConfig } from "../utils/AppConfigContext"

export const PriceComponent = React.memo((
    {
        amount,
        style,
        textStyle,
        prefix,
        suffix
    }: {
        amount: BN,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string
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
            borderRadius: 9,
            height: 24,
            justifyContent: 'center',
            alignItems: 'flex-start',
            alignSelf: 'flex-start',
            paddingVertical: 4, paddingHorizontal: 8
        }, style]}>
            <Text style={[{
                color: Theme.item,
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16
            }, textStyle]}>
                {`${prefix ?? ''}${formatCurrency((parseFloat(fromNano(amount.abs())) * price.price.usd * price.price.rates[currency]).toFixed(2), currency, amount.isNeg())}${suffix ?? ''}`}
            </Text>
        </View>
    )
})