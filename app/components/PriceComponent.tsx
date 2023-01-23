import BN from "bn.js"
import React, { useMemo } from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { fromNano } from "ton"
import { AppConfig } from "../AppConfig"
import { usePrice } from "../engine/PriceContext"
import { Theme } from "../Theme"
import { formatCurrency } from "../utils/formatCurrency"

export const PriceComponent = React.memo((
    {
        amount,
        style,
        textStyle,
        prefix,
        suffix,
        centFontStyle
    }: {
        amount: BN,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string,
        centFontStyle?: StyleProp<TextStyle>
    }
) => {
    const [price, currency] = usePrice();
    const summ: { value: string, cents?: string } | undefined = useMemo(() => {
        if (price) {
            const splited = (parseFloat(fromNano(amount.abs())) * price.price.usd * price.price.rates[currency]).toFixed(2).split('.');
            if (splited.length === 2) {
                return {
                    value: splited[0],
                    cents: splited[1]
                };
            }
            return { value: splited[0], cents: undefined };
        }
    }, [price]);

    if (!summ || AppConfig.isTestnet) {
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
                {prefix ?? ''}
                {formatCurrency(summ.value, currency, amount.isNeg())}
                <Text style={[centFontStyle]}>
                    {summ.cents ? `.${summ.cents}` : ''}
                </Text>
                {suffix ?? ''}
            </Text>
        </View >
    )
})