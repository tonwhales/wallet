import { StatusBar, StatusBarStyle } from "expo-status-bar";
import React, { ReactNode, useEffect } from "react"
import { Platform, View, Text, StyleProp, ViewStyle } from "react-native"
import { AndroidToolbar } from "./topbar/AndroidToolbar";
import { ThemeType, useAppConfig } from "../utils/AppConfigContext";
import { HeaderBackButton } from "@react-navigation/elements";
import { t } from "../i18n/t";
import { CloseButton } from "./CloseButton";
import { TypedNavigation } from "../utils/useTypedNavigation";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export function useScreenHeader(
    navigation: TypedNavigation,
    Theme: ThemeType,
    options: {
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void,
        rightButton?: ReactNode,
        leftButton?: ReactNode,
    } & NativeStackNavigationOptions
) {
    useEffect(() => {
        navigation.setOptions({
            headerShown: options.headerShown,
            headerSearchBarOptions: options.headerSearchBarOptions,
            headerLeft: () => {
                return (
                    options.leftButton ? options.leftButton : !!options.onBackPressed
                        ? <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            onPress={options.onBackPressed}
                            tintColor={options.tintColor ?? Theme.accent}
                            style={{ marginLeft: -12 }}
                        />
                        : null
                );
            },
            title: options.title,
            headerBackVisible: true,
            headerRight: () => {
                return (
                    options.rightButton ? options.rightButton : !!options.onClosePressed
                        ? <CloseButton
                            onPress={options.onClosePressed}
                            tintColor={options.tintColor}
                        />
                        : null
                );
            }
        });
    }, [navigation, options, Theme]);
}

export const ScreenHeader = React.memo((
    {
        style,
        title,
        textColor,
        tintColor,
        onBackPressed,
        onClosePressed,
        leftButton,
        rightButton,
        titleComponent,
        statusBarStyle
    }: {
        style?: StyleProp<ViewStyle>,
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void,
        rightButton?: React.ReactNode,
        leftButton?: React.ReactNode,
        titleComponent?: React.ReactNode,
        statusBarStyle?: StatusBarStyle
    }
) => {
    const { Theme } = useAppConfig();

    return (
        <View style={[{ width: '100%' }, style]}>
            <StatusBar style={statusBarStyle || (Platform.OS === 'ios' ? 'light' : 'dark')} />
            <AndroidToolbar
                onBack={onBackPressed}
                style={{ minHeight: 44 }}
                pageTitle={title}
                tintColor={tintColor}
                textColor={textColor}
                titleComponent={titleComponent}
                rightButton={rightButton}
                leftButton={leftButton}
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
                        {!!title && !titleComponent && (
                            <Text style={{
                                color: textColor ?? Theme.textPrimary,
                                fontWeight: '600',
                                fontSize: 17,
                                lineHeight: 24,
                                maxWidth: '60%'
                            }}
                                ellipsizeMode={'tail'}
                            >
                                {title}
                            </Text>
                        )}
                        {titleComponent}
                    </View>
                    {!!onBackPressed && !leftButton && (
                        <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            onPress={onBackPressed}
                            tintColor={tintColor ?? Theme.accent}
                        />
                    )}
                    {!!onClosePressed && !rightButton && (
                        <>
                            <View style={{ flexGrow: 1 }} />
                            <CloseButton
                                onPress={onClosePressed}
                                tintColor={tintColor}
                                style={{ marginRight: 16 }}
                            />
                        </>
                    )}
                    {!onBackPressed && !!leftButton && (leftButton)}
                    {!onClosePressed && !!rightButton && (
                        <>
                            <View style={{ flexGrow: 1 }} />
                            {rightButton}
                        </>
                    )}
                </View>
            )}
        </View>
    );
});