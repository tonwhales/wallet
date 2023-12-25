import { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";

export function usePulsatingStyle(progress: SharedValue<number>) {
    return useAnimatedStyle(() => {
        const opacity = interpolate(
            progress.value,
            [0, 1],
            [1, 0.85],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            progress.value,
            [0, 1],
            [1, 1.005],
            Extrapolation.CLAMP,
        )
        return {
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);
}