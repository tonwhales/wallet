import React from "react";
import { StyleProp, View, ViewStyle, Text } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TabHeader = React.memo((
    { title, style }: { title: string, style?: StyleProp<ViewStyle> }
) => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();

    return (
        <View style={[
            {
                height: 44,
                justifyContent: 'center',
                marginTop: safeArea.top,
            }, style
        ]}>
            <Text
                numberOfLines={1}
                style={{
                    color: Theme.textColor,
                    textAlign: 'center',
                    fontWeight: '600', fontSize: 17, lineHeight: 24,
                }}
            >
                {title}
            </Text>
        </View >
    );
});