import React from "react";
import { memo, useEffect } from "react";
import Animated, { Easing, Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { usePulsatingStyle } from "./usePulsatingStyle";
import { View } from "react-native";
import { useTheme } from "../../engine/hooks";
import { ThemeType } from "../../engine/state/theme";

const SectionHeader = memo(({ theme }: { theme: ThemeType }) => {
    const rndmWith = Math.floor(Math.random() * 100) + 100;
    return (
        <View style={{ width: '100%', paddingVertical: 8, opacity: 0.3 }}>
            <View style={{ borderRadius: 12, height: 24, width: rndmWith, backgroundColor: theme.textSecondary }} />
        </View>
    )
});

export const TransactionsSkeleton = memo(() => {
    const animation = useSharedValue(0);
    const theme = useTheme();

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 700,
                    easing: Easing.linear
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const opacity = interpolate(
            animation.value,
            [0, 1],
            [1, 0.85],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP,
        )
        return {
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);

    const components = Array.from({ length: 20 }).map((_, index) => {
        const right = Math.random() * 50;
        const left = Math.max(Math.random() * 100, 50);

        const rndmShoHeader = index === 0 || (Math.floor(Math.random() * 4) + index % 3) > 3;

        return (
            <Animated.View
                key={`tx-skeleton-${index}`}
                style={[animatedStyles]}
            >
                {rndmShoHeader && <SectionHeader theme={theme} />}
                <View style={{
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 0, paddingVertical: 20,
                    opacity: 0.3
                }}>
                    <View style={{
                        width: 46, height: 46,
                        borderRadius: 23,
                        borderWidth: 0, marginRight: 10,
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: theme.textSecondary,
                    }} />
                    <View style={{ flex: 1, marginRight: 4 }}>
                        <View style={{
                            height: 24, width: left + 28,
                            backgroundColor: theme.textSecondary,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                        }} />
                        <View style={{
                            height: 20, width: left + 56,
                            backgroundColor: theme.textSecondary,
                            borderTopRightRadius: 4,
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                        }} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{
                            height: 20, width: right + 32,
                            backgroundColor: theme.textSecondary,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                        }} />
                        <View style={{
                            height: 18, width: right + 64,
                            backgroundColor: theme.textSecondary,
                            borderTopLeftRadius: 4,
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                        }} />
                    </View>
                </View>
            </Animated.View>
        )
    })

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
                {
                    width: '100%',
                    paddingHorizontal: 20,
                    marginTop: 4, flexGrow: 1
                },
            ]}
        >
            <Animated.View style={{ flexGrow: 1 }}>
                {components}
            </Animated.View>
        </Animated.View>
    );
});