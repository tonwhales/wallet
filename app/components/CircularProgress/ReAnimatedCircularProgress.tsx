import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Svg, Circle } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, SharedValue, useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { memo, useEffect } from "react";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ReAnimatedCircularProgress = memo(({
    size,
    style,
    strokeWidth,
    color,
    progress,
    reverse,
    infinitRotate,
    backdropColor,
    loaderProgress,
    loaderOpacity,
    rotationActive
}: {
    size: number,
    loaderProgress?: SharedValue<number>,
    loaderOpacity?: SharedValue<number>,
    rotationActive?: boolean,
    style?: StyleProp<ViewStyle>,
    strokeWidth?: number,
    color?: string,
    progress?: number,
    reverse?: boolean,
    infinitRotate?: boolean,
    backdropColor?: string
}) => {
    const progressCircle = useSharedValue(progress !== undefined ? (progress - 1) : 1);
    const rotation = useSharedValue(0);

    useDerivedValue(() => {
        if (loaderProgress) {
            progressCircle.value = loaderProgress.value
        }
    })

    const animatedRotation = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value * 360}deg` }],
            opacity: loaderOpacity ? loaderOpacity.value : 1
        }
    }, []);

    const Circle_Length = 2 * Math.PI * (size / 2);
    const Radius = Circle_Length / (2 * Math.PI);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: Circle_Length * progressCircle.value,
    }));

    const animateReverse = () => {
        'worklet'
        progressCircle.value = withRepeat(
            withTiming(0, { duration: 2000, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
            -1,
            true
        );
    }
    useEffect(() => {
        if (rotationActive) {

            if (reverse && !infinitRotate) {
                animateReverse();
            }
            if (infinitRotate) {
                rotation.value = withRepeat(
                    withTiming(rotation.value + 1, { duration: 1500, easing: Easing.linear }),
                    -1,
                );
            }
        } else {
            cancelAnimation(rotation)
        }
    }, [rotationActive]);

    useEffect(() => {
        if (progress !== undefined) {
            progressCircle.value = withSpring((progress - 1), { duration: 500 })
        }
    }, [progress]);

    return (
        <Animated.View style={[{
            height: size + (strokeWidth || 2) + 2,
            width: size + (strokeWidth || 2) + 2,
            justifyContent: 'center', alignItems: 'center'
        },
            style,
            animatedRotation
        ]}>
            <Svg
                height={size + (strokeWidth || 2)}
                width={size + (strokeWidth || 2)}
                style={{
                    height: size + (strokeWidth || 2),
                    width: size + (strokeWidth || 2),
                    justifyContent: 'center', alignItems: 'center'
                }}
            >
                {backdropColor && (
                    <Circle
                        cx={(size + (strokeWidth || 1.5)) / 2}
                        cy={(size + (strokeWidth || 1.5)) / 2}
                        r={Radius}
                        stroke={backdropColor}
                        strokeWidth={strokeWidth ?? 1.5}
                        fill={"transparent"}
                        strokeDasharray={Circle_Length}
                        strokeLinecap="round"
                    />
                )}
                <AnimatedCircle
                    cx={(size + (strokeWidth || 1.5)) / 2}
                    cy={(size + (strokeWidth || 1.5)) / 2}
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