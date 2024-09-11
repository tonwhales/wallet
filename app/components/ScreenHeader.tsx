import React, { ReactNode, memo, useEffect } from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { CloseButton } from "./navigation/CloseButton";
import { TypedNavigation, useTypedNavigation } from "../utils/useTypedNavigation";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { BackButton } from "./navigation/BackButton";
import { ThemeType } from "../engine/state/theme";
import { useTheme } from "../engine/hooks";
import { PerfText } from "./basic/PerfText";
import { Typography } from "./styles";

export function useScreenHeader(
    navigation: TypedNavigation,
    theme: ThemeType,
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
            ...options,
            headerShown: options.headerShown,
            headerSearchBarOptions: options.headerSearchBarOptions,
            contentStyle: options.contentStyle,
            headerLeft: () => {
                return (
                    options.leftButton ? options.leftButton : !!options.onBackPressed
                        ? <BackButton onPress={options.onBackPressed} />
                        : null
                );
            },
            title: options.title,
            headerTitleStyle: {
                color: options.textColor ?? theme.textPrimary,
                fontWeight: '600',
                fontSize: 17
            },
            headerStyle: options.headerSearchBarOptions ? {
                backgroundColor: theme.elevation,
            } : undefined,
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
                                    backgroundColor: theme.backgroundPrimary,
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
                        />
                    );
                },
        });
    }, [navigation, options, theme]);
}

export type ScreenHeaderProps = {
    style?: StyleProp<ViewStyle>,
    title?: string,
    titleStyle?: StyleProp<TextStyle>,
    textColor?: string,
    tintColor?: string,
    onBackPressed?: () => void,
    onClosePressed?: () => void,
    closeButtonStyle?: StyleProp<ViewStyle>,
    rightButton?: ReactNode,
    leftButton?: ReactNode,
    titleComponent?: ReactNode,
    options?: NativeStackNavigationOptions
}

export const ScreenHeader = memo((
    {
        style,
        title,
        titleStyle,
        textColor,
        tintColor,
        onBackPressed,
        onClosePressed,
        closeButtonStyle,
        leftButton,
        rightButton,
        titleComponent,
        options
    }: ScreenHeaderProps
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
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                height: 44,
                marginTop: 14
            }}>
                <View style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    {!!title && !titleComponent && (
                        <PerfText style={[{ color: textColor ?? theme.textPrimary, maxWidth: '60%' }, Typography.semiBold17_24, titleStyle]}
                            ellipsizeMode={'tail'}
                        >
                            {title}
                        </PerfText>
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
                            style={[{ marginRight: 16 }, closeButtonStyle]}
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
ScreenHeader.displayName = 'ScreenHeader';