import React, { memo, useEffect } from "react";
import { View, ViewStyle, StyleProp, ColorValue } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";

export const PendingIcon = memo(({
    style,
    borderColor
}: {
    style?: StyleProp<ViewStyle>,
    borderColor: ColorValue
}) => {
    const rotation = useSharedValue(0);

    const animatedRotation = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 360}deg` }] }), []);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(rotation.value + 1, { duration: 1500, easing: Easing.linear }),
            -1,
        );
    }, []);

    return (
        <Animated.View style={[
            {
                height: 20,
                width: 20,
                position: 'absolute',
                bottom: -2, right: -2,
            },
            animatedRotation,
            style
        ]}>
            <View
                style={{
                    backgroundColor: '#FF9A50',
                    height: 20, width: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: borderColor,
                    justifyContent: 'center', alignItems: 'center'
                }}
            >
                <Image style={{ height: 10, width: 10 }} source={require('@assets/ic-pending-arch.png')} />
            </View>
        </Animated.View>
    );
}); 