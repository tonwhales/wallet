import BN from "bn.js"
import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { fromNano } from "ton"
import { AppConfig } from "../AppConfig"
import { usePrice } from "../engine/PriceContext"
import { Theme } from "../Theme"
import { formatCurrency } from "../utils/formatCurrency"

export const PriceComponent = React.memo(({ amount, style, textStyle }: { amount: BN, style?: StyleProp<ViewStyle>, textStyle?: StyleProp<TextStyle> }) => {
    const [price, currency] = usePrice();

    if (!price || AppConfig.isTestnet) {
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
                color: 'white',
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16
            }, textStyle]}>
                {amount.isNeg() ? '-' : ''}
                {`$${(parseFloat(fromNano(amount.abs())) * price.price.usd)
                    .toFixed(2)
                    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`
                }
            </Text>
        </View>
    )
})