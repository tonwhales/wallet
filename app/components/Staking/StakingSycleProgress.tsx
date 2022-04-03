import React from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { Theme } from "../../Theme";

export const StakingSycleProgress = React.memo(({ stakeUntil, style }: { stakeUntil: number, style?: StyleProp<ViewStyle> }) => {
    const left = stakeUntil - (Date.now() / 1000);
    const progress = 100 - Math.floor(left * 100) / (36 * 60 * 60);

    return (
        <View
            style={[{

            }, style]}
        >
            <View
                style={{
                    backgroundColor: Theme.accent,
                    height: 4,
                    width: `${progress}%`
                }}
            />
            <View
                style={{
                    backgroundColor: Theme.accent,
                    flexGrow: 1,
                    opacity: 0.2,
                    width: `${progress}%`
                }}
            />
        </View>
    );
})