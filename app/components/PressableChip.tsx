import { memo } from "react"
import { Pressable, StyleProp, ViewStyle, TextStyle } from "react-native";
import Animated from "react-native-reanimated";
import React from "react";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { PerfText } from "./basic/PerfText";
import { Typography } from "./styles";

export const PressableChip = memo(({
    onPress,
    style,
    text,
    textStyle
}: {
    onPress?: () => void,
    style?: StyleProp<ViewStyle>,
    text: string,
    textStyle?: StyleProp<TextStyle>
}) => {
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    return (
        <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onPress}
            hitSlop={4}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
            <Animated.View style={[
                {
                    paddingHorizontal: 16, paddingVertical: 6,
                    borderRadius: 100,
                    height: 32,
                },
                style,
                animatedStyle
            ]}>
                <PerfText style={[
                    { textAlign: 'center', textAlignVertical: 'center' },
                    Typography.medium15_20,
                    textStyle
                ]}>
                    {text}
                </PerfText>
            </Animated.View>
        </Pressable>
    )
})