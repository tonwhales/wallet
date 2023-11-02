import { StatusBar, StatusBarStyle } from "expo-status-bar";
import React, { ReactNode, memo, useEffect } from "react"
import { Platform, View, Text, StyleProp, ViewStyle } from "react-native"
import { CloseButton } from "./navigation/CloseButton";
import { TypedNavigation, useTypedNavigation } from "../utils/useTypedNavigation";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { BackButton } from "./navigation/BackButton";
import { useTheme } from "../engine/hooks/theme/useTheme";

export function useScreenHeader(
    navigation: TypedNavigation,
    theme: any,
    options: {
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void,
        rightButton?: ReactNode,
        leftButton?: ReactNode,
        headerComponentStyle?: StyleProp<ViewStyle>,
    } & NativeStackNavigationOptions
) {
    useEffect(() => {
        navigation.setOptions({
            headerShown: options.headerShown,
            headerSearchBarOptions: options.headerSearchBarOptions,
            headerLeft: () => {
                return (
                    options.leftButton ? options.leftButton : !!options.onBackPressed
                        ? <BackButton onPress={options.onBackPressed} />
                        : null
                );
            },
            title: options.title,
            headerTitleStyle: {
                color: options.textColor ?? theme.textColor,
                fontWeight: '600',
                fontSize: 17
            },
            headerBackVisible: true,
            headerRight: () => {
                return (
                    options.rightButton ? options.rightButton : !!options.onClosePressed
                        ? <CloseButton onPress={options.onClosePressed} />
                        : null
                );
            },
            header: options.headerSearchBarOptions
                ? undefined
                : () => {
                    return (
                        <ScreenHeader
                            style={[
                                {
                                    backgroundColor: theme.background,
                                    borderTopLeftRadius: 16,
                                    borderTopRightRadius: 16,
                                    paddingHorizontal: 16,
                                },
                                options.headerStyle,
                                options.headerComponentStyle
                            ]}
                            title={options.title}
                            textColor={options.textColor}
                            tintColor={options.tintColor}
                            onBackPressed={options.onBackPressed}
                            onClosePressed={options.onClosePressed}
                            rightButton={options.rightButton}
                            leftButton={options.leftButton}
                            statusBarStyle={options.statusBarStyle}
                        />
                    );
                },
        });
    }, [navigation, options, theme]);
}

export const ScreenHeader = memo((
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
        statusBarStyle,
        options
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
        statusBarStyle?: StatusBarStyle,
        options?: NativeStackNavigationOptions
    }
) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
            ...options
        })
    }, [options]);

    return (
        <View style={[{ width: '100%' }, style]}>
            <StatusBar style={statusBarStyle || (Platform.OS === 'ios' ? 'light' : 'dark')} />
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
                            color: textColor ?? theme.textColor,
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
                    <BackButton onPress={onBackPressed} />
                )}
                {!!onClosePressed && !rightButton && (
                    <>
                        <View style={{ flexGrow: 1 }} />
                        <CloseButton
                            onPress={onClosePressed}
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
        </View>
    );
});