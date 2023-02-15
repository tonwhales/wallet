import React, { useEffect, useRef } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AppConfig } from "../AppConfig";
import { Theme } from "../Theme";

export const stakingCycle = AppConfig.isTestnet ? 8 * 60 * 60 : 36 * 60 * 60;

export const ProgressBar = React.memo((
    {
        left,
        style,
        color,
        full,
        reverse
    }: {
        left: number,
        style?: StyleProp<ViewStyle>,
        color?: string,
        full?: number,
        reverse?: boolean
    }
) => {
    const progress = 100 - Math.floor((left * 100) / (full ? full : stakingCycle));
    const ref = useRef<Animated.View>(null);
    const scale = useSharedValue(0);

    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${scale.value}%`
        };
    }, []);

    useEffect(() => {
        scale.value = withTiming(progress, {
            duration: 900,
            easing: Easing.bezier(1, 0.29, 0.53, 0.6),
        });
    }, [progress]);

    return (
        <Animated.View
            ref={ref}
            style={[{
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
            }, style, { ...progressStyle }]}
        >
            {!reverse && (<View
                style={[{
                    backgroundColor: color ? color : Theme.accent,
                    height: 4,
                    width: '100%',
                }]}
            />)}
            <View
                style={[{
                    backgroundColor: color ? color : Theme.accent,
                    flexGrow: 1,
                    opacity: 0.1,
                    width: '100%'
                }]}
            />
            {reverse && (<View
                style={[{
                    backgroundColor: color ? color : Theme.accent,
                    height: 4,
                    width: '100%',
                }]}
            />)}
        </Animated.View>
    );
})