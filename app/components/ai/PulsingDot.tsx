import React, { memo } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';

interface PulsingDotProps {
    color?: string;
    size?: number;
}

export const PulsingDot = memo(({ color = '#007AFF', size = 8 }: PulsingDotProps) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 800, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 800, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );

        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
                withTiming(0.3, { duration: 800, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                animatedStyle,
            ]}
        />
    );
});
