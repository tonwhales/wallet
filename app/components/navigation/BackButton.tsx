import React from "react";
import { Pressable, StyleProp, ViewStyle, Image } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks/useTheme";

export const BackButton = React.memo((props: {
    onPress?: () => void,
    style?: StyleProp<ViewStyle>
}) => {
    const  theme = useTheme();
    const navigation = useTypedNavigation();

    return (
        <Pressable
            style={({ pressed }) => [
                {
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.unchecked,
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
                    tintColor: theme.textSecondary,
                    height: 10, width: 6,
                    justifyContent: 'center', alignItems: 'center',
                    left: -1
                }}
                source={require('../../../assets/ic-nav-back.png')}
            />
        </Pressable>
    )
})