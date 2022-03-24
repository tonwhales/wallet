import React, { useEffect } from "react"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { Theme } from "../../Theme";

export const AnimatedCircle = React.memo(({ error }: { error?: boolean }) => {
    const scale = useSharedValue(1);

    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                scale: withSpring(scale.value)
            }],
        };
    }, []);

    useEffect(() => {
        scale.value = 1.3;
        setTimeout(() => {
            scale.value = 1
        }, 100)
    }, [error]);


    return (
        <Animated.View style={[{
            height: 12, width: 12,
            backgroundColor: error ? Theme.warningText : Theme.accent,
            borderRadius: 12,
            margin: 4
        }, scaleStyle]}>

        </Animated.View>
    )
})