import React from "react";
import { memo, useEffect } from "react";
import Animated, { Easing, FadeIn, FadeOut, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
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

    const animatedStyles = usePulsatingStyle(animation);

    const components = Array.from({ length: 20 }).map((_, index) => {
        const right = Math.random() * 50;
        const left = Math.max(Math.random() * 100, 50);

        const rndmShoHeader = index === 0 || (Math.floor(Math.random() * 4) + index % 3) > 3;

        return (
            <View key={`tx-skeleton-${index}`}>
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
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                        }} />
                        <View style={{
                            height: 20, width: left + 56,
                            backgroundColor: theme.textSecondary,
                            borderTopRightRadius: 8,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                        }} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{
                            height: 20, width: right + 32,
                            backgroundColor: theme.textSecondary,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                        }} />
                        <View style={{
                            height: 18, width: right + 64,
                            backgroundColor: theme.textSecondary,
                            borderTopLeftRadius: 8,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                        }} />
                    </View>
                </View>
            </View>
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
            <Animated.View style={[{ flexGrow: 1 }, animatedStyles]}>
                {components}
            </Animated.View>
        </Animated.View>
    );
});