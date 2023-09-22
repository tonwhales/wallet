import { Pressable, View, Text, Platform } from "react-native";
import { fragment } from "../fragment";
import { useAppConfig } from "../utils/AppConfigContext";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { t } from "../i18n/t";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTypedNavigation } from "../utils/useTypedNavigation";

import IcCheck from "@assets/ic-check.svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ThemeFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { changeTheme, Theme, themeStyle } = useAppConfig();
    const { onPressIn: onPressInSystem, onPressOut: onPressOutSystem, animatedStyle: animatedStyleSystem } = useAnimatedPressedInOut();
    const { onPressIn: onPressInLight, onPressOut: onPressOutLight, animatedStyle: animatedStyleLight } = useAnimatedPressedInOut();
    const { onPressIn: onPressInDark, onPressOut: onPressOutDark, animatedStyle: animatedStyleDark } = useAnimatedPressedInOut();

    return (
        <View>
            <ScreenHeader
                title={t('theme.title')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <Pressable
                key={`theme-system`}
                style={{ marginTop: 16 }}
                onPress={() => changeTheme('system')}
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
                            backgroundColor: Theme.border,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleSystem
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: Theme.textPrimary
                        }}>
                            {t('theme.system')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'system' ? Theme.accent : Theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'system' && (
                            <IcCheck
                                color={Theme.white}
                                height={16} width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>
            <Pressable
                key={`theme-light`}
                onPress={() => changeTheme('light')}
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
                            backgroundColor: Theme.border,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleLight
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: Theme.textPrimary
                        }}>
                            {t('theme.light')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'light' ? Theme.accent : Theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'light' && (
                            <IcCheck
                                color={Theme.white}
                                height={16} width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>
            <Pressable
                key={`theme-dark`}
                onPress={() => changeTheme('dark')}
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
                            backgroundColor: Theme.border,
                            marginBottom: 16, marginHorizontal: 16
                        },
                        animatedStyleDark
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: Theme.textPrimary
                        }}>
                            {t('theme.dark')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: themeStyle === 'dark' ? Theme.accent : Theme.divider,
                        borderRadius: 12
                    }}>
                        {themeStyle === 'dark' && (
                            <IcCheck
                                color={Theme.white}
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