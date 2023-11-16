import { BlurView } from "expo-blur";
import React from "react"
import { View, Text, Platform, TouchableNativeFeedback } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderBackButton } from "@react-navigation/elements";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useTheme } from '../../engine/hooks';
import { Ionicons } from '@expo/vector-icons';

export const TopBar = React.memo(({ title, showBack }: { title?: string, showBack?: boolean }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <>
            {Platform.OS === 'ios' && (
                <BlurView style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        {!!showBack && (
                            <HeaderBackButton
                                style={{
                                    position: 'absolute',
                                    left: 0, bottom: 0
                                }}
                                label={t('common.back')}
                                labelVisible
                                onPress={() => {
                                    navigation.goBack();
                                }}
                                tintColor={theme.accent}
                            />
                        )}
                        {!!title && (
                            <Text style={[
                                { fontSize: 17, color: theme.textPrimary, fontWeight: '600' },
                            ]}>
                                {title}
                            </Text>
                        )}
                    </View>
                    <View style={{ backgroundColor: theme.backgroundPrimary, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: theme.black,
                        opacity: 0.08
                    }} />
                </BlurView>
            )}
            {Platform.OS === 'android' && (
                <View style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {!!title && (
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[
                                { fontSize: 17, color: theme.textPrimary, fontWeight: '600' },
                            ]}>
                                {title}
                            </Text>
                        </View>
                    )}
                    {!!showBack && (
                        <View style={{
                            position: 'absolute',
                            left: 16, bottom: 8
                        }}>
                            <TouchableNativeFeedback
                                onPress={() => {
                                    navigation.goBack();
                                }}
                                background={TouchableNativeFeedback.Ripple(theme.surfaceOnElevation, true, 24)}
                                hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                            >
                                <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="arrow-back-outline" size={28} color={theme.accent} />
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    )}
                    <View style={{ backgroundColor: theme.backgroundPrimary, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: theme.black,
                        opacity: 0.08
                    }} />
                </View>
            )}
        </>
    )
})