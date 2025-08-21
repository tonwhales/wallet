import React, { memo, useEffect } from "react";
import { View, ViewStyle, StyleProp, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
    interpolate,
    Extrapolation
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../engine/hooks";

interface AnimatedSkeletonProps {
    width?: number;
    height?: number;
    backgroundColor?: string;
    style?: StyleProp<ViewStyle>;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const AnimatedSkeleton = memo(({
    width,
    height,
    backgroundColor,
    style
}: AnimatedSkeletonProps) => {
    const theme = useTheme();
    const animation = useSharedValue(0);
    const { width: DEVICE_WIDTH } = Dimensions.get('window');

    useEffect(() => {
        animation.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.linear
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            animation.value,
            [0, 1],
            [-DEVICE_WIDTH, DEVICE_WIDTH],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateX }],
        };
    });

    const bgColor = backgroundColor || theme.surfaceOnElevation;
    const shimmerColor = theme.style === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)';

    return (
        <View
            style={[
                {
                    width: width || undefined,
                    height: height || 20,
                    flex: width ? 0 : 1,
                    backgroundColor: bgColor,
                    borderRadius: 10,
                    overflow: 'hidden',
                },
                style
            ]}
        >
            <AnimatedLinearGradient
                colors={['transparent', shimmerColor, 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
                style={[
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: DEVICE_WIDTH,
                    },
                    animatedStyle
                ]}
            />
        </View>
    );
});