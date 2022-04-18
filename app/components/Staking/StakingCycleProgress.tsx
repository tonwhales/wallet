import React, { useEffect, useRef } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import Animated, { call, Easing, measure, runOnUI, useAnimatedStyle, useCode, useSharedValue, withTiming } from "react-native-reanimated";
import { Theme } from "../../Theme";

export const StakingCycleProgress = React.memo(({ stakeUntil, style }: { stakeUntil: number, style?: StyleProp<ViewStyle> }) => {
    const left = stakeUntil - (Date.now() / 1000);
    const progress = 100 - Math.floor((left * 100) / (36 * 60 * 60));
    const ref = useRef<Animated.View>(null);
    const scale = useSharedValue(0);

    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${scale.value}%`
        };
    }, []);

    useEffect(() => {
        scale.value = withTiming(progress, {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [progress]);

    console.log({ width: `${progress}%` })

    return (
        <Animated.View
            ref={ref}
            style={[{
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
            }, style, { ...progressStyle }]}
        >
            <View
                style={[{
                    backgroundColor: Theme.accent,
                    height: 4,
                    width: '100%',
                }]}
            />
            <View
                style={[{
                    backgroundColor: Theme.accent,
                    flexGrow: 1,
                    opacity: 0.1,
                    width: '100%'
                }]}
            />
        </Animated.View>
    );
})