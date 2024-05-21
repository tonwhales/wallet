import { Platform, Pressable, View, Text } from "react-native"
import { fragment } from "../fragment"
import { StatusBar } from "expo-status-bar"
import { useSearchEngine, useTheme } from "../engine/hooks";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";

import IcCheck from "@assets/ic-check.svg";

export const SearchEngineFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [searchEngine, setSearchEngine] = useSearchEngine();

    const { onPressIn: onPressInGoogle, onPressOut: onPressOutGoogle, animatedStyle: animatedStyleGoogle } = useAnimatedPressedInOut();
    const { onPressIn: onPressInDDG, onPressOut: onPressOutDDG, animatedStyle: animatedStyleDDG } = useAnimatedPressedInOut();

    return (
        <View>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('settings.searchEngine')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <Pressable
                key={'google'}
                style={{ marginTop: 16 }}
                onPress={() => setSearchEngine('google')}
                onPressIn={onPressInGoogle}
                onPressOut={onPressOutGoogle}
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
                        animatedStyleGoogle
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: theme.textPrimary
                        }}>
                            {t('browser.search.suggestions.google')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: searchEngine === 'google' ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {searchEngine === 'google' && (
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
                key={'ddg'}
                onPress={() => setSearchEngine('ddg')}
                onPressIn={onPressInDDG}
                onPressOut={onPressOutDDG}
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
                        animatedStyleDDG
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            color: theme.textPrimary
                        }}>
                            {t('browser.search.suggestions.ddg')}
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: searchEngine === 'ddg' ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {searchEngine === 'ddg' && (
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
})