import React from "react"
import { StyleProp, View, Text, ViewStyle } from "react-native"
import { usePrice } from "../engine/PriceContext";
import TonIcon from '../../assets/ton_icon.svg';
import { formatCurrency } from "../utils/formatCurrency";
import { useAppConfig } from "../utils/AppConfigContext";

export const ExchangeRate = React.memo(({ style }: { style?: StyleProp<ViewStyle> }) => {
    const [price, currency] = usePrice();
    const { Theme, AppConfig } = useAppConfig();

    if (!price || AppConfig.isTestnet) {
        return <></>;
    }

    return (
        <View style={[
            {
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                paddingVertical: 4, paddingHorizontal: 9,
                height: 24,
            },
            style
        ]}>
            <View style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0, right: 0,
                backgroundColor: Theme.surfacePimary,
                opacity: 0.1,
                borderRadius: 8
            }} />
            <TonIcon height={12} width={12} />
            <Text style={[{
                color: Theme.surfacePimary,
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16,
                marginLeft: 6
            }]}>
                {`${formatCurrency((price.price.usd * price.price.rates[currency]).toFixed(2), currency)}`}
            </Text>
        </View>
    )
});