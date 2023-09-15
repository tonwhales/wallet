import React, { useEffect } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import CircularProgress from "../CircularProgress/CircularProgress";
import { ReAnimatedCircularProgress } from "../CircularProgress/ReAnimatedCircularProgress";

export const StakingCycleProgress = React.memo((
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
    const { Theme, AppConfig } = useAppConfig();
    const stakingCycle = AppConfig.isTestnet ? 8 * 60 * 60 : 36 * 60 * 60;
    const progress = 100 - Math.floor((left * 100) / (full ? full : stakingCycle));
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
        <ReAnimatedCircularProgress
            size={64}
            color={'#AAA5F0'}
            strokeWidth={8}
            progress={(progress / 100) - 0.05}
            backdropColor={Theme.divider}
        />
    );
})