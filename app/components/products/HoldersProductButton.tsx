import React from "react"
import { View } from "react-native";
import { useEngine } from "../../engine/Engine";

export const HoldersProductButton = React.memo(() => {
    const engine = useEngine();
    const cards = engine.products.zenPay.useCards();

    return (
        <View>

        </View>
    );
})