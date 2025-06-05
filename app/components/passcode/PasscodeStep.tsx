import React, { memo, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import { emojis } from "../../utils/emojis";
import { useTheme } from "../../engine/hooks";

const getRandomEmoji = () => {
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
}

// Angle configurations for different passcode lengths
const getStartAngle = (index: number, totalSteps: number): number => {
    if (totalSteps === 4) {
        // Positions: top-left, bottom-left, bottom-right, top-right
        const angles = [-3 * Math.PI / 4, 3 * Math.PI / 4, Math.PI / 4, -Math.PI / 4];
        return angles[index];
    }
    
    if (totalSteps === 6) {
        // Symmetric distribution: left side goes left, right side goes right
        const angles = [-2 * Math.PI / 3, Math.PI, 2 * Math.PI / 3, Math.PI / 3, 0, -Math.PI / 3];
        return angles[index];
    }
    
    // Default: evenly distributed starting from top
    return (-Math.PI / 2) + (index * 2 * Math.PI / totalSteps);
};

export const PasscodeStep = memo((
    {
        dotSize,
        error,
        emoji,
        index,
        passLen,
        fontSize,
        isLoading,
        totalSteps,
    }: {
        dotSize: number,
        error?: boolean,
        emoji?: boolean,
        index: number,
        passLen: number,
        fontSize?: number,
        isLoading?: boolean,
        totalSteps: number,
    }
) => {
    const theme = useTheme();
    const size = emoji ? 32 : dotSize;
    const rndmEmoji = useMemo(() => {
        if (!emoji) return '';
        return getRandomEmoji();
    }, [emoji]);

    // Calculate start angle once outside of animated style
    const startAngle = useMemo(() => getStartAngle(index, totalSteps), [index, totalSteps]);

    const scale = useSharedValue(1);
    const animColor = useSharedValue(theme.textSecondary);
    const rotation = useSharedValue(0);
    const centerOffset = useSharedValue(0);
    
    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            backgroundColor: animColor.value
        };
    });

    // Loader animation: dots move to center and rotate in circle
    const loaderStyle = useAnimatedStyle(() => {
        if (!isLoading) {
            return { transform: [{ translateX: 0 }, { translateY: 0 }] };
        }

        // Move dots to center (neutralize their original positions)
        const originalOffset = (index - (totalSteps - 1) / 2) * (size + 22);
        const centerX = -originalOffset * centerOffset.value;

        // Add circular rotation
        const radius = 25;
        const currentAngle = rotation.value + startAngle;
        
        const circleX = Math.cos(currentAngle) * radius * centerOffset.value;
        const circleY = Math.sin(currentAngle) * radius * centerOffset.value;

        return {
            transform: [
                { translateX: centerX + circleX },
                { translateY: circleY }
            ]
        };
    });

    useEffect(() => {
        if (isLoading) {
            // Start loader: move to center and begin rotation
            centerOffset.value = withTiming(1, { duration: 300 });
            rotation.value = withRepeat(
                withTiming(2 * Math.PI, { duration: 1200 }),
                -1,
                false
            );
            animColor.value = withTiming(theme.accent);
        } else {
            // Stop loader: return to original positions
            centerOffset.value = withTiming(0, { duration: 400 });
            rotation.value = withTiming(0, { duration: 400 });
            
            // Apply normal passcode state styling
            if (error) {
                animColor.value = withTiming(theme.accentRed);
            } else if (index === passLen - 1) {
                scale.value = withSpring(1.4, { damping: 10, stiffness: 100 }, () => { scale.value = 1 });
                animColor.value = withTiming(theme.accent);
            } else if (index > passLen - 1) {
                animColor.value = withTiming(theme.textSecondary);
            } else if (index < passLen - 1) {
                animColor.value = withTiming(theme.accent);
            }
        }
    }, [passLen, error, isLoading]);

    return (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            width: size, height: size,
            marginHorizontal: 11,
        }}>
            <Animated.View
                style={[{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    justifyContent: 'center',
                    alignItems: 'center'
                }, scaleStyle, loaderStyle]}
            >
                {!!emoji && (
                    <Text style={{ fontSize }}>
                        {rndmEmoji}
                    </Text>
                )}
            </Animated.View>
        </View>
    );
});