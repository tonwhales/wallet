import React from "react";
import { Pressable, StyleProp, ViewStyle, Platform, Image } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";

export const CloseButton = React.memo((props: {
    onPress?: () => void,
    style?: StyleProp<ViewStyle>,
}) => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    if (Platform.OS !== 'ios') {
        return null;
    }
    return (
        <Pressable
            style={({ pressed }) => [
                {
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 32,
                    height: 32, width: 32,
                    justifyContent: 'center', alignItems: 'center',
                },
                props.style
            ]}
            onPress={() => {
                (props.onPress ?? navigation.goBack)();
            }}
        >
            <Image
                style={{
                    tintColor: Theme.textSecondary,
                    height: 24, width: 24,
                    justifyContent: 'center', alignItems: 'center',
                }}
                source={require('@assets/ic-nav-close.png')}
            />
        </Pressable>
    )
})