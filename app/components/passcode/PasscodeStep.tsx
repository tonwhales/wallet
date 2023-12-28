import React, { memo, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { emojis } from "../../utils/emojis";
import { useTheme } from "../../engine/hooks";

const getRandomEmoji = () => {
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
}

export const PasscodeStep = memo((
    {
        dotSize,
        error,
        emoji,
        index,
        passLen,
        fontSize,
    }: {
        dotSize: number,
        error?: boolean,
        emoji?: boolean,
        index: number,
        passLen: number,
        fontSize?: number,
    }
) => {
    const theme = useTheme();
    const size = emoji ? 32 : dotSize;
    const rndmEmoji = useMemo(() => {
        if (!emoji) return '';
        return getRandomEmoji();
    }, [emoji]);

    const scale = useSharedValue(1);
    const animColor = useSharedValue(theme.textSecondary);
    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            backgroundColor: animColor.value
        };
    });

    useEffect(() => {
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
    }, [passLen, error]);

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
                }, scaleStyle]}
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