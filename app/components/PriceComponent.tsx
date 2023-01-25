import BN from "bn.js"
import { BlurView } from "expo-blur"
import React, { useMemo } from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle, Platform } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
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
        centFontStyle,
        hidden
    }: {
        amount: BN,
        style?: StyleProp<ViewStyle>,
        textStyle?: StyleProp<TextStyle>,
        prefix?: string,
        suffix?: string,
        centFontStyle?: StyleProp<TextStyle>,
        hidden?: boolean
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
            {hidden && (
                <Animated.View
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 4, overflow: 'hidden' }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    {Platform.OS !== 'ios' && (<View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'grey' }} />)}
                    {Platform.OS === 'ios' && (
                        <Text style={[{
                            fontSize: 14, fontWeight: '600',
                            textAlign: "center",
                            lineHeight: 16
                        }, textStyle, { color: Theme.accent }]}>{'********'}</Text>
                    )}
                    {Platform.OS === 'ios' && (<BlurView intensity={50} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />)}
                </Animated.View>
            )}
        </View >
    )
})