import React, { memo, useMemo } from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { formatCurrency } from "../utils/formatCurrency"
import { usePrice, useTheme } from "../engine/hooks";
import { fromNano } from "@ton/core";

import TonSign from '@assets/ic_ton_sign.svg';

export const PriceComponent = memo((
    {
        amount,
        style,
        textStyle,
        centsTextStyle,
        prefix,
        suffix,
        currencyCode,
        showSign
    }: {
        amount: bigint,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        centsTextStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string,
        currencyCode?: string,
        showSign?: boolean
    }
) => {
    const theme = useTheme();
    const [price, currency] = usePrice();

    if (!price) {
        return <></>;
    }

    const isNeg = amount < 0;
    const abs = isNeg ? -amount : amount;

    const fullText = useMemo(() => {
        return `${prefix ?? ''}${formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currencyCode || currency]).toFixed(2),
            currencyCode || currency,
            isNeg
        )}${suffix ?? ''}`
    }, [amount, price, currencyCode, currency, prefix, suffix]);

    const decimalPoint = fullText.match(/[.,]/)?.[0];
    const parts = fullText.split(decimalPoint ?? /[.,]/);
    const integer = parts[0];
    const cents = parts[1];

    return (
        <View style={[{
            backgroundColor: theme.accent,
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
                color: theme.surfaceOnBg,
                fontSize: 15, fontWeight: '500',
                textAlign: "center",
                lineHeight: 20
            }, textStyle]}>
                {`${integer}${decimalPoint ?? ','}`}
                <Text style={centsTextStyle}>
                    {cents}
                </Text>
            </Text>
        </View>
    )
})