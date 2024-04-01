import { memo, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { ThemeType } from "../../engine/state/theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../ScreenHeader";

export const SwapSkeleton = memo(({ theme, loaded }: { theme: ThemeType, loaded: boolean }) => {
    const animation = useSharedValue(0);

    const animatedContentStyles = useAnimatedStyle(() => {
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.03],
            Extrapolation.CLAMP,
        );
        return {
            transform: [{ scale: scale }],
        };
    }, []);

    const navigation = useTypedNavigation();
    const [animationPlayed, setAnimationPlayed] = useState(loaded);
    const [showClose, setShowClose] = useState(false);

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
            opacity: withTiming(opacity.value, { duration: 150, easing: Easing.bezier(0.42, 0, 1, 1) }),
            paddingHorizontal: 16,
        };
    });

    useEffect(() => {
        if (loaded) {
            setTimeout(() => {
                opacity.value = 0;
                setTimeout(() => {
                    setAnimationPlayed(true);
                }, 150);
            }, 400);
        }
    }, [loaded]);

    useEffect(() => {
        setTimeout(() => {
            setShowClose(true);
        }, 3000);

        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 450,
                    easing: Easing.bezier(0.42, 0, 1, 1)
                }),
                -1,
                true,
            );
    }, []);

    if (animationPlayed) {
        return null;
    }

    return (
        <Animated.View
            style={animatedStyles}
        >
            <ScreenHeader
                onBackPressed={showClose ? navigation.goBack : undefined}
                style={{ width: '100%' }}
            />
            <Animated.View style={[
                {
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 6,
                    marginTop: -40
                },
                animatedContentStyles
            ]}>
                <View style={{
                    width: 32, height: 32,
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 16
                }} />
                <View style={{ height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.surfaceOnElevation, height: 28, width: 112, borderRadius: 20 }} />
                </View>
                <View style={{ width: 32, height: 32, }} />
            </Animated.View>
            <View style={{ paddingHorizontal: 4 }}>
                <Animated.View
                    style={[
                        {
                            backgroundColor: theme.surfaceOnElevation,
                            height: 186,
                            width: '100%',
                            borderRadius: 20,
                            marginTop: 18,
                            alignSelf: 'center'
                        },
                        animatedContentStyles
                    ]}
                />
                <Animated.View
                    style={[
                        {
                            zIndex: 1,
                            backgroundColor: theme.accent,
                            height: 36,
                            width: 36,
                            borderRadius: 36,
                            marginTop: -9,
                            marginBottom: -9,
                            alignSelf: 'center'
                        },
                        animatedContentStyles
                    ]}
                />
                <Animated.View
                    style={[
                        {
                            backgroundColor: theme.surfaceOnElevation,
                            height: 186,
                            width: '100%',
                            borderRadius: 20,
                            alignSelf: 'center'
                        },
                        animatedContentStyles
                    ]}
                />
            </View>
        </Animated.View>
    );
});