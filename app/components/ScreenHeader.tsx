import { StatusBar } from "expo-status-bar";
import React from "react"
import { Platform, View, Text, StyleProp, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "./topbar/AndroidToolbar";
import { useAppConfig } from "../utils/AppConfigContext";
import { HeaderBackButton } from "@react-navigation/elements";
import { t } from "../i18n/t";
import { CloseButton } from "./CloseButton";

export const ScreenHeader = React.memo((
    {
        style,
        title,
        textColor,
        tintColor,
        onBackPressed,
        onClosePressed
    }: {
        style?: StyleProp<ViewStyle>,
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void
    }
) => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();

    return (
        <View style={[{ width: '100%' }, style]}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar
                onBack={onBackPressed}
                style={{ position: 'absolute', top: safeArea.top }}
                pageTitle={title}
                tintColor={tintColor}
                textColor={textColor}
            />
            {Platform.OS === 'ios' && (
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    height: 44,
                    marginTop: 14,
                }}>
                    <View style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={{
                            color: textColor ?? Theme.textColor,
                            fontWeight: '600',
                            fontSize: 17,
                            lineHeight: 24,
                        }}>
                            {title}
                        </Text>
                    </View>
                    {!!onBackPressed && (
                        <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            onPress={onBackPressed}
                            tintColor={tintColor ?? Theme.accent}
                        />
                    )}
                    {!!onClosePressed && (
                        <>
                            <View style={{ flexGrow: 1 }} />
                            <CloseButton
                                onPress={onClosePressed}
                                tintColor={tintColor}
                                style={{ marginRight: 16 }}
                            />
                        </>
                    )}
                </View>
            )}
        </View>
    );
});