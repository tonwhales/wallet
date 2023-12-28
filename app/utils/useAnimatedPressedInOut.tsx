import { useCallback } from "react";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export function useAnimatedPressedInOut() {
    const animatedValue = useSharedValue(1);

    const onPressIn = useCallback(() => {
        animatedValue.value = withTiming(0.99, { duration: 100 });
    }, [animatedValue]);

    const onPressOut = useCallback(() => {
        animatedValue.value = withTiming(1, { duration: 100 });
    }, [animatedValue]);

    const animatedStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: animatedValue.value }], };
    });

    return {
        animatedStyle,
        onPressIn,
        onPressOut,
    }
}