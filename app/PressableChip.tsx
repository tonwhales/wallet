import { memo, useCallback, useState } from "react"
import { Pressable, StyleProp, ViewStyle, Text, TextStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

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
    const animatedValue = useSharedValue(1);

    const onPressIn = useCallback(() => {
        animatedValue.value = withTiming(0.98, { duration: 100 });
    }, [animatedValue]);

    const onPressOut = useCallback(() => {
        animatedValue.value = withTiming(1, { duration: 100 });
    }, [animatedValue]);

    const animatedStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: animatedValue.value }], };
    });
    return (
        <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onPress}
        >
            <Animated.View style={[
                {
                    marginRight: 8,
                    paddingHorizontal: 17, paddingVertical: 4,
                    borderRadius: 20,
                    height: 28,
                },
                style,
                animatedStyle
            ]}>
                <Text style={[
                    {
                        fontWeight: '400',
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