import React from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { fromNano } from "ton"
import { AppConfig } from "../AppConfig"
import { useAccount } from "../sync/Engine"
import { Theme } from "../Theme"

export const PriceComponent = React.memo(({ style }: { style?: StyleProp<ViewStyle> }) => {
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

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
            <Text style={{
                color: 'white',
                fontSize: 14, fontWeight: '600',
                textAlign: "center",
                lineHeight: 16
            }}>
                {`$ ${(parseFloat(fromNano(account.balance)) * price.price.usd)
                    .toFixed(2)
                    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`
                }
            </Text>
        </View>
    )
})