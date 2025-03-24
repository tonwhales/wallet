import { memo, useEffect } from "react";
import { Platform, View, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, Extrapolation, interpolate } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../engine/hooks";
import { RoundButton } from "../../../components/RoundButton";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { Image } from "expo-image";

export const SettingsPlaceholder = memo(({
    onReload,
    onSupport,
    showClose
}: {
    onReload?: () => void,
    onSupport?: () => void,
    showClose?: boolean
}) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withRepeat(
            withTiming(1, {
                duration: 500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1)
            }),
            14,
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
            Platform.select({ android: { paddingTop: safeArea.top } }),
        ]}>
            <Animated.View style={[{ paddingHorizontal: 16 }, animatedStyles]}>
                <View style={{
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 16,
                        opacity: showClose ? 0 : 1
                    }} />
                    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.surfaceOnBg,
                            height: 28, width: 132,
                            borderRadius: 20
                        }} />
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16 }} />
                </View>
                <View
                    style={{
                        marginTop: 16,
                        height: 86,
                        width: '100%',
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20,
                        alignSelf: 'center'
                    }}
                />
                {!showClose && (
                    <View
                        style={{
                            marginTop: 16,
                            height: 316,
                            width: '100%',
                            backgroundColor: theme.surfaceOnBg,
                            borderRadius: 20,
                            alignSelf: 'center'
                        }}
                    />
                )}
            </Animated.View>
            {showClose && (
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
                            <RoundButton
                                title={t('common.reload')}
                                onPress={onReload}
                                style={{ alignSelf: 'stretch' }}
                            />
                        )}
                        {onSupport && (
                            <RoundButton
                                title={t('webView.contactSupport')}
                                onPress={onSupport}
                                display={'secondary'}
                                style={[
                                    { alignSelf: 'stretch' },
                                    Platform.select({ android: { marginBottom: 16 + safeArea.bottom } })
                                ]}
                            />
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});