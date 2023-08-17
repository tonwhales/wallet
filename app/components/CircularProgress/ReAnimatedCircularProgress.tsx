import { StyleProp, View, ViewStyle } from "react-native";

import { Svg, Circle } from 'react-native-svg';
import Animated, { Easing, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { memo, useEffect } from "react";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ReAnimatedCircularProgress = memo(({
    size,
    style,
    strokeWidth,
    color,
    progress,
    loop,
    infinitRotate
}: {
    size: number,
    style?: StyleProp<ViewStyle>,
    strokeWidth?: number,
    color?: string,
    progress?: number,
    loop?: boolean,
    infinitRotate?: boolean
}) => {
    const progressCircle = useSharedValue(progress !== undefined ? (progress - 1) : 1);
    const rotation = useSharedValue(0);

    const animatedRotation = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${ rotation.value * 360}deg` }],
        }
    }, []);

    const Circle_Length = 2 * Math.PI * (size / 2);
    const Radius = Circle_Length / (2 * Math.PI);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: Circle_Length * progressCircle.value,
    }));

    const animateLoop = () => {
        'worklet'
        progressCircle.value = withRepeat(
            withTiming(0, { duration: 2000, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
            -1,
            true
        );
    }

    useEffect(() => {
        if (loop && !infinitRotate) {
            animateLoop();
        }
        if (infinitRotate) {
            rotation.value = withRepeat(
                withTiming(rotation.value + 1, { duration: 1500, easing: Easing.linear }),
                -1,
            );
        }
    }, []);

    useEffect(() => {
        if (progress !== undefined) {
            progressCircle.value = withSpring((progress - 1), { duration: 500 })
        }
    }, [progress]);

    return (
        <Animated.View style={[{
            height: size + 4,
            width: size + 4,
            justifyContent: 'center', alignItems: 'center'
        },
            style,
            animatedRotation
        ]}>
            <Svg
                height={size + 2}
                width={size + 2}
                style={{
                    height: size + 2,
                    width: size + 2,
                    justifyContent: 'center', alignItems: 'center'
                }}
            >
                <AnimatedCircle
                    cx={size / 2 + 1}
                    cy={size / 2 + 1}
                    r={Radius}
                    stroke={color ?? "#82CD47"}
                    strokeWidth={strokeWidth ?? 1.5}
                    fill={"transparent"}
                    strokeDasharray={Circle_Length}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                />
            </Svg>
        </Animated.View>
    );
})