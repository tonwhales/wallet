import { memo, useEffect } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, Extrapolation, FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Platform, View, Text } from "react-native";
import { } from "react-native";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { Image } from "expo-image";
import { Typography } from "../../../components/styles";

export const AccountPlaceholder = memo(({
    theme,
    onReload,
    onSupport,
    showClose
}: {
    theme: ThemeType,
    onReload?: () => void,
    onSupport?: () => void,
    showClose?: boolean
}) => {
    const safeArea = useSafeAreaInsets();
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withRepeat(
            withTiming(1, {
                duration: 500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1)
            }),
            10,
            true,
        );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const opacity = interpolate(
            animation.value,
            [0, 1],
            [1, theme.style === 'dark' ? 0.75 : 1],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP
        )
        return {
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, [theme.style]);

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
            <Animated.View style={[{
                backgroundColor: theme.backgroundUnchangeable,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                paddingTop: 8
            }, animatedStyles]}>
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
                        borderRadius: 16,
                        opacity: showClose ? 0 : 1
                    }} />
                    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: '#1c1c1e',
                            height: 28, width: 132,
                            borderRadius: 20
                        }} />
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
            </Animated.View>

            {(onReload || onSupport) && (
                <View style={{
                    flexGrow: 1,
                    paddingHorizontal: 16, paddingBottom: safeArea.bottom,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Image
                        source={require('@assets/ic-bad-connection.png')}
                        style={{ width: 84, height: 84, marginBottom: 16 }}
                    />
                    <Text style={[{ color: theme.textPrimary, marginBottom: 8, textAlign: 'center' }, Typography.semiBold24_30]}>
                        {t('products.holders.loadingLongerTitle')}
                    </Text>
                    <Text style={[{ color: theme.textSecondary, textAlign: 'center', marginBottom: 24, marginHorizontal: 32 }, Typography.regular17_24]}>
                        {t('products.holders.loadingLonger')}
                    </Text>
                    <View style={{ gap: 16, width: '100%' }}>
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
            )}
        </View>
    );
});
