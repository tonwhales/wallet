import React from "react"
import { Pressable, PressableProps } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const ScalingPressable = React.memo((props: PressableProps & { lock?: boolean, transformScale?: number }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => {
        if (props.lock) return {};
        return { transform: [{ scale: withTiming(scale.value, { duration: 150, easing: Easing.bezier(1, 0.29, 0.53, 0.6), }) }] }
    });
    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                {...props}
                onPressIn={() => scale.value = (props.transformScale ?? 0.95)}
                onPressOut={() => scale.value = 1}
            />
        </Animated.View>
    );
})