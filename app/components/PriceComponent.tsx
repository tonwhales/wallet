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
            height: 27,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingVertical: 4, paddingHorizontal: 10
        }, style]}>
            {showSign && (
                <View style={{
                    height: 16, width: 16,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: '#1678EA', borderRadius: 16,
                    marginRight: 6
                }}>
                    <TonSign
                        height={6.5}
                        width={6.5}
                        style={{ height: 6.5, width: 6.5 }}
                    />
                </View>
            )}
            <Text style={[{
                color: Theme.surfacePimary,
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16
            }, textStyle]}>
                {`${prefix ?? ''}${formatCurrency((parseFloat(fromNano(amount.abs())) * price.price.usd * price.price.rates[currencyCode || currency]).toFixed(2), currencyCode || currency, amount.isNeg())}${suffix ?? ''}`}
            </Text>
        </View>
    )
})