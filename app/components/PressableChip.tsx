import { memo } from "react"
import { Pressable, StyleProp, ViewStyle, Text, TextStyle } from "react-native";
import Animated from "react-native-reanimated";
import React from "react";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";

export const PressableChip = memo(({
    onPress,
    style,
    text,
    textStyle
}: {
    onPress: () => void,
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
        >
            <Animated.View style={[
                {
                    marginRight: 8,
                    paddingHorizontal: 16, paddingVertical: 6,
                    borderRadius: 10,
                    height: 32,
                },
                style,
                animatedStyle
            ]}>
                <Text style={[
                    {
                        fontWeight: '500',
                        fontSize: 15, lineHeight: 20,
                        textAlign: 'center', textAlignVertical: 'center',
                    },
                    textStyle
                ]}>
                    {text}
                </Text>
            </Animated.View>
        </Pressable>
    )
})