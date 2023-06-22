import React from "react";
import { Pressable, Text, StyleProp, ViewStyle, Platform } from "react-native";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";

export const CloseButton = React.memo((props: { onPress?: () => void, style?: StyleProp<ViewStyle>, dark?: boolean }) => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    if (Platform.OS !== 'ios') {
        return null;
    }
    return (
        <Pressable
            style={({ pressed }) => { return [props.style, { opacity: pressed ? 0.5 : 1 }] }}
            onPress={() => {
                (props.onPress ?? navigation.goBack)();
            }}
        >
            <Text style={{ color: Theme.accent, fontWeight: '500', fontSize: 17, lineHeight: 24 }}>
                {t('common.close')}
            </Text>
        </Pressable>
    )
})