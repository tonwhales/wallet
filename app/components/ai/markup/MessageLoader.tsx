import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from "react-native-reanimated";
import { useTheme } from "../../../engine/hooks";

export const MessageLoader = () => {
    const theme = useTheme();

    const Dot = ({ index }: { index: number }) => {
        const opacity = useSharedValue(0.3);

        useEffect(() => {
            opacity.value = withDelay(
                index * 200,
                withRepeat(
                    withSequence(
                        withTiming(1, { duration: 600 }),
                        withTiming(0.3, { duration: 600 })
                    ),
                    -1,
                    true
                )
            );
        }, []);

        const style = useAnimatedStyle(() => ({
            opacity: opacity.value
        }));

        return (
            <Animated.View style={[{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.textPrimary,
                marginHorizontal: 2
            }, style]} />
        );
    };

    return (
        <View style={{ flexDirection: 'row', padding: 4, alignItems: 'center' }}>
            <Dot index={0} />
            <Dot index={1} />
            <Dot index={2} />
        </View>
    );
};

