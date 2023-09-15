import React from "react";
import { StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export const TabHeader = React.memo(({
    title,
    style,
    rightAction
}: {
    title: string,
    style?: StyleProp<ViewStyle>,
    rightAction?: any
}) => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();

    return (
        <View style={[
            {
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: safeArea.top,
                flexDirection: 'row',
                backgroundColor: Theme.background,
            }, style
        ]}>
            {Platform.OS === 'android' && <StatusBar style={'dark'} />}
            <Text
                numberOfLines={1}
                style={{
                    color: Theme.textPrimary,
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