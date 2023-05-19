import React, { useState } from "react"
import { Pressable, PressableProps, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const ScalingPressable = React.memo((props: PressableProps & { transformScale?: number }) => {
    const [longPressed, setLongPressed] = useState(false);
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: withTiming(scale.value, { duration: 50, easing: Easing.bezier(1, 0.29, 0.53, 0.6), }) }] }
    });

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                {...props}
                onLongPress={(e) => {
                    setLongPressed(true);
                    if (props.onLongPress) props.onLongPress(e);
                }}
                onPressIn={() => scale.value = (props.transformScale ?? 0.95)}
                onPressOut={(event) => {
                    if (longPressed) {
                        setLongPressed(false);
                    }
                    scale.value = 1;
                }}
                onPress={(e) => {
                    if (longPressed) {
                        return;
                    }
                    if (props.onPress) props.onPress(e);
                }}
            />
        </Animated.View>
    );
})