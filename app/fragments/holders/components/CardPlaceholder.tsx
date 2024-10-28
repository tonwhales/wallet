import { memo, useEffect } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, useWindowDimensions, View } from "react-native";
import { Text } from "react-native";
import { Image } from "expo-image"; import Animated, { Easing, Extrapolation, FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { t } from "../../../i18n/t";
import { RoundButton } from "../../../components/RoundButton";
import { Typography } from "../../../components/styles";
;

export const CardPlaceholder = memo(({
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
    const dimensions = useWindowDimensions();
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
            Platform.select({
                ios: { paddingTop: safeArea.top - 8 },
                android: { paddingTop: safeArea.top }
            })
        ]}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                marginTop: 44 + 24,
                gap: 26
            }}>
                <Animated.View
                    style={[{
                        backgroundColor: theme.surfaceOnBg,
                        width: 32,
                        height: 152,
                        borderTopEndRadius: 18,
                        borderBottomEndRadius: 18
                    }, animatedStyles]}
                />
                <Animated.View
                    style={[{
                        backgroundColor: theme.surfaceOnBg,
                        width: dimensions.width - 98,
                        height: 184,
                        borderRadius: 20
                    }, animatedStyles]}
                />
                <Animated.View
                    style={[{
                        backgroundColor: theme.surfaceOnBg,
                        width: 32,
                        height: 152,
                        borderTopStartRadius: 18,
                        borderBottomStartRadius: 18
                    }, animatedStyles]}
                />
            </View>
            <Animated.View style={[{
                backgroundColor: theme.surfaceOnBg,
                alignSelf: 'center',
                height: 96,
                width: dimensions.width - 32,
                marginTop: 38,
                borderRadius: 20,
                opacity: 1
            }, animatedStyles]} />
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