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
                    flexGrow: 1,
                    opacity: 0.7,
                    paddingTop: safeArea.top,
                },
            ]}
        >
            <Animated.View style={[{ flexGrow: 1 }, animatedStyles]}>
                <View style={{ paddingHorizontal: 16 }}>
                    <View
                        style={{
                            backgroundColor: theme.backgroundUnchangeable,
                            height: 360,
                            paddingTop: 100,
                            position: 'absolute',
                            top: -10,
                            left: 0,
                            right: 0,
                            borderRadius: 20,
                            alignItems: 'center',
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 20,
                        }}
                    >
                        <View style={{
                            height: 44,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            marginTop: 12,
                        }}>
                            <View style={{
                                width: 32, height: 32,
                                backgroundColor: theme.divider,
                                borderRadius: 16
                            }} />
                            <View style={{ height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ backgroundColor: theme.divider, height: 32, width: 132, borderRadius: 20 }} />
                            </View>
                            <View style={{ width: 32, height: 32, }} />
                        </View>
                        <View
                            style={{
                                backgroundColor: theme.divider,
                                height: 28,
                                width: 142,
                                borderRadius: 8,
                                marginTop: 30
                            }}
                        />
                    </View>
                    <View
                        style={{
                            backgroundColor: theme.surfaceOnBg,
                            height: 96,
                            borderRadius: 20,
                            marginTop: 86,
                            position: 'absolute',
                            top: 230,
                            left: 16, right: 16,
                        }}
                    />
                    <View style={{
                        position: 'absolute',
                        top: 488,
                        left: 16, right: 16,
                    }}>
                        <View
                            style={{
                                backgroundColor: theme.surfaceOnBg,
                                height: 84,
                                borderRadius: 20,
                                marginBottom: 16,
                            }}
                        />
                        <View
                            style={{
                                backgroundColor: theme.surfaceOnBg,
                                height: 84,
                                borderRadius: 20,
                                marginBottom: 16,
                            }}
                        />
                        <View
                            style={{
                                backgroundColor: theme.surfaceOnBg,
                                height: 84,
                                borderRadius: 20,
                                marginBottom: 16,
                            }}
                        />
                    </View>
                </View>
            </Animated.View>

        </Animated.View>
    );
});