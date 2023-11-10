import React from "react";
import { memo, useEffect } from "react";
import Animated, { Easing, FadeIn, FadeOut, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { usePulsatingStyle } from "./usePulsatingStyle";
import { View } from "react-native";
import { useTheme } from "../../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const WalletSkeleton = memo(() => {
    const animation = useSharedValue(0);
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

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

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
                {
                    width: '100%',
                    marginTop: 4, flexGrow: 1,
                    opacity: 0.7,
                    paddingTop: safeArea.top,
                    backgroundColor: theme.backgroundUnchangeable,
                },
            ]}
        >
            <Animated.View style={[{ flexGrow: 1 }, animatedStyles]}>
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={{
                        height: 44,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 24, height: 24,
                            backgroundColor: theme.divider,
                            borderRadius: 12
                        }} />
                        <View style={{ height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: theme.divider, height: 32, width: 120, borderRadius: 20 }} />
                        </View>
                        <View style={{ width: 24, height: 24 }} />
                    </View>
                    <View style={{
                        backgroundColor: theme.divider,
                        borderRadius: 20,
                        paddingVertical: 16, paddingHorizontal: 20,
                        overflow: 'hidden', height: 176,
                        marginTop: 16
                    }} />
                    <View style={{
                        backgroundColor: theme.divider,
                        borderRadius: 20,
                        paddingVertical: 16, paddingHorizontal: 20,
                        overflow: 'hidden', height: 92,
                        marginTop: 16
                    }} />
                </View>
                <View style={{
                    backgroundColor: theme.surfacePimary,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingVertical: 16, paddingHorizontal: 20,
                    overflow: 'hidden', height: 92,
                    marginTop: 16, flexGrow: 1
                }} />
            </Animated.View>

        </Animated.View>
    );
});