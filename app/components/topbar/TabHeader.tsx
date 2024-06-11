import React, { memo } from "react";
import { StyleProp, View, ViewStyle, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

export const TabHeader = memo(({
    title,
    style,
    rightAction
}: {
    title: string,
    style?: StyleProp<ViewStyle>,
    rightAction?: any
}) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();

    return (
        <View style={[
            {
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: safeArea.top,
                flexDirection: 'row',
                backgroundColor: theme.backgroundPrimary,
            }, 
            style
        ]}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <Text
                numberOfLines={1}
                style={{
                    color: theme.textPrimary,
                    textAlign: 'center', alignSelf: 'center',
                    fontWeight: '600', fontSize: 17, lineHeight: 24,
                }}
            >
                {title}
            </Text>
            {!!rightAction && (
                <View style={{
                    position: 'absolute', top: 0, bottom: 0, right: 16,
                    justifyContent: 'center', alignItems: 'center',
                    alignSelf: 'flex-end'
                }}>
                    {rightAction}
                </View>
            )}
        </View >
    );
});