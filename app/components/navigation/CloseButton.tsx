import React, { memo } from "react";
import { Pressable, StyleProp, ViewStyle, Image } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks/theme/useTheme";

export const CloseButton = memo((props: {
    onPress?: () => void,
    style?: StyleProp<ViewStyle>,
}) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    return (
        <Pressable
            style={({ pressed }) => [
                {
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.surfaceOnElevation,
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
                    tintColor: theme.iconNav,
                    height: 24, width: 24,
                    justifyContent: 'center', alignItems: 'center',
                }}
                source={require('@assets/ic-nav-close.png')}
            />
        </Pressable>
    )
})