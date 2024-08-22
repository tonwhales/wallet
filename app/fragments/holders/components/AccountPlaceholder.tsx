import { memo, useEffect } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeInDown, FadeInUp, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Platform, View, StyleSheet, TextInput, Dimensions } from "react-native";
import { } from "react-native";
import {
    Blur,
    Canvas,
    Group,
    Paint,
    Path,
    RoundedRect,
    Skia,
    SweepGradient,
    vec,
} from "@shopify/react-native-skia";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";

const GlowingBorderView = memo(({ width, height, glowSize, blurRadius, theme, borderRadius }: {
    theme: ThemeType
    width: number,
    height: number,
    glowSize: number,
    blurRadius: number,
    borderRadius?: number
}) => {
    // const GLOW_COLOR = "#1976edFF";
    const GLOW_BG_COLOR = "#1976ed00"; // Should be the same color as GLOW_COLOR but fully transparent
    // const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
    const rotation = useSharedValue(0);

    const screenWidth = 132;
    const screenHeight = 36;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerVec = vec(centerX, centerY);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(2, {
                duration: 4000,
                easing: Easing.linear,
            }),
            -1,
            false,
        );
    }, []);

    const animatedRotation = useDerivedValue(() => {
        return [{ rotate: Math.PI * rotation.value }];
    }, [rotation]);

    const GlowGradient = () => {
        return (
            <RoundedRect r={borderRadius} x={0} y={0} width={width} height={height}>
                <SweepGradient
                    origin={centerVec}
                    c={centerVec}
                    colors={[theme.backgroundUnchangeable, theme.accent, theme.accent, theme.backgroundUnchangeable]}
                    start={0}
                    end={360 * glowSize}
                    transform={animatedRotation}
                />
            </RoundedRect>
        );
    };

    return (
        <Canvas style={{ height, width, position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}>
            <Group
                origin={{ x: screenWidth / 2, y: screenHeight / 2 }}
                transform={[
                    { translateX: (screenWidth - width) / 2 },
                    { translateY: (screenHeight - height) / 2 }
                ]}
            >
                {/* Blurred Glow */}
                <Group>
                    <GlowGradient />
                    <Blur blur={blurRadius} />
                </Group>

                {/* Outline */}
                <GlowGradient />

                {/* Box overlay */}
                <RoundedRect
                    r={20}
                    x={5}
                    y={5}
                    width={width - 10}
                    height={height - 10}
                    color={'#1c1c1e'}
                />
            </Group>
        </Canvas>
    );
});

export const AccountPlaceholder = memo(({
    theme,
    onReload,
    onSupport
}: {
    theme: ThemeType,
    onReload?: () => void,
    onSupport?: () => void
}) => {
    const safeArea = useSafeAreaInsets();

    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(1, {
                duration: 2000,
                easing: Easing.linear,
            }),
            -1, // Infinite repeat
            false // Do not reverse
        );

        return () => {
            rotation.value = 0; // Reset the animation value when the component unmounts
        };
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {};
    });

    return (
        <View style={[
            { flexGrow: 1, width: '100%' },
            Platform.select({
                ios: { paddingTop: safeArea.top - 8 },
                android: { paddingTop: safeArea.top }
            })
        ]}>
            <View
                style={[
                    {
                        backgroundColor: theme.backgroundUnchangeable,
                        position: 'absolute', top: 0, left: 0, right: 0
                    },
                    Platform.select({
                        ios: { height: safeArea.top - 8 },
                        android: { height: safeArea.top }
                    }),
                ]}
            />
            <View style={{
                backgroundColor: theme.backgroundUnchangeable,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                paddingTop: 8
            }}>
                <View style={[
                    {
                        height: 44,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        width: '100%'
                    },
                ]}>
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: '#1c1c1e',
                        borderRadius: 16
                    }} />
                    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View style={[{
                            height: 44, width: 136,
                            borderRadius: 20, justifyContent: 'center',
                            overflow: 'hidden', paddingTop: 4
                        },
                            animatedStyle
                        ]}>
                            <GlowingBorderView
                                width={132}
                                height={36}
                                glowSize={0.2}
                                blurRadius={20}
                                borderRadius={20}
                                theme={theme}
                            />
                        </Animated.View>

                    </View>
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: '#1c1c1e',
                        borderRadius: 16
                    }} />
                </View>
                <View
                    style={{
                        height: 28,
                        width: 78,
                        backgroundColor: '#1c1c1e',
                        borderRadius: 20,
                        marginTop: 20 + 38 + 20,
                        alignSelf: 'center'
                    }}
                />
                <View
                    style={{
                        backgroundColor: theme.surfaceOnBg,
                        height: 96,
                        borderRadius: 20,
                        marginTop: 24,
                        marginHorizontal: 16,
                        marginBottom: - 48
                    }}
                />
            </View>
            <View style={{ position: 'absolute', bottom: safeArea.bottom, left: 16, right: 16, gap: 8 }}>
                {onReload && (
                    <Animated.View entering={FadeInDown}>
                        <RoundButton
                            title={t('common.reload')}
                            onPress={onReload}
                            style={{ alignSelf: 'stretch' }}
                        />
                    </Animated.View>
                )}
                {onSupport && (
                    <Animated.View entering={FadeInDown}>
                        <RoundButton
                            title={t('webView.contactSupport')}
                            onPress={onSupport}
                            display={'secondary'}
                            style={[
                                { alignSelf: 'stretch' },
                                Platform.select({ android: { marginBottom: 16 + safeArea.bottom } })
                            ]}
                        />
                    </Animated.View>
                )}
            </View>
        </View>
    );
});
