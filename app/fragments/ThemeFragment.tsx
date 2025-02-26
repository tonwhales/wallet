import { Pressable, View, Text, Platform } from "react-native";
import { fragment } from "../fragment";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { t } from "../i18n/t";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemeStyle } from "../engine/hooks";
import { ThemeStyle } from "../engine/state/theme";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { changeNavBarColor } from "../modules/NavBar";

import IcCheck from "@assets/ic-check.svg";

export const ThemeFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const [themeStyle, changeTheme] = useThemeStyle()

    const { onPressIn: onPressInSystem, onPressOut: onPressOutSystem, animatedStyle: animatedStyleSystem } = useAnimatedPressedInOut();
    const { onPressIn: onPressInLight, onPressOut: onPressOutLight, animatedStyle: animatedStyleLight } = useAnimatedPressedInOut();
    const { onPressIn: onPressInDark, onPressOut: onPressOutDark, animatedStyle: animatedStyleDark } = useAnimatedPressedInOut();

    useEffect(() => {
        changeNavBarColor(theme.surfaceOnBg, undefined, true);
    }, [theme.surfaceOnBg])

    return (
        <View>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('theme.title')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <Pressable
                key={`theme-system`}
                style={{ marginTop: 16 }}
                onPress={() => changeTheme(ThemeStyle.System)}
                onPressIn={onPressInSystem}
                onPressOut={onPressOutSystem}
            >
                <Animated.View
                    style={[
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 20,
                            borderRadius: 20,
                            backgroundColor: theme.surfaceOnElevation,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleSystem
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: theme.textPrimary
                        }}>
                            {t('theme.system')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'system' ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'system' && (
                            <IcCheck
                                color={theme.white}
                                height={16} width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>
            <Pressable
                key={`theme-light`}
                onPress={() => changeTheme(ThemeStyle.Light)}
                onPressIn={onPressInLight}
                onPressOut={onPressOutLight}
            >
                <Animated.View
                    style={[
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 20,
                            borderRadius: 20,
                            backgroundColor: theme.surfaceOnElevation,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleLight
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: theme.textPrimary
                        }}>
                            {t('theme.light')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'light' ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'light' && (
                            <IcCheck
                                color={theme.white}
                                height={16} width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>
            <Pressable
                key={`theme-dark`}
                onPress={() => changeTheme(ThemeStyle.Dark)}
                onPressIn={onPressInDark}
                onPressOut={onPressOutDark}
            >
                <Animated.View
                    style={[
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 20,
                            borderRadius: 20,
                            backgroundColor: theme.surfaceOnElevation,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleDark
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: theme.textPrimary
                        }}>
                            {t('theme.dark')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'dark' ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'dark' && (
                            <IcCheck
                                color={theme.white}
                                height={16} width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    )
});