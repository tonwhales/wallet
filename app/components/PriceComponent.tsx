import BN from "bn.js"
import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { fromNano } from "@ton/core";
import { formatCurrency } from "../utils/formatCurrency"
import { useTheme } from '../engine/hooks';
import { usePrice } from '../engine/hooks'

export const PriceComponent = React.memo((
    {
        amount,
        style,
        textStyle,
        prefix,
        suffix
    }: {
        amount: bigint,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string
    }
) => {
    const theme = useTheme();
    const [price, currency] = usePrice();

    if (!price) {
        return <></>;
    }

    return (
        <View style={[{
            backgroundColor: theme.accent,
            borderRadius: 9,
            height: 24,
            justifyContent: 'center',
            alignItems: 'flex-start',
            alignSelf: 'flex-start',
            paddingVertical: 4, paddingHorizontal: 8
        }, style]}>
            <Text style={[{
                color: theme.surfacePimary,
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16
            }, textStyle]}>
                {`${prefix ?? ''}${formatCurrency((parseFloat(fromNano((amount < 0n) ? -amount : amount)) * price.price.usd * price.price.rates[currency]).toFixed(2), currency, amount < 0n)}${suffix ?? ''}`}
            </Text>
        </View>
    )
})