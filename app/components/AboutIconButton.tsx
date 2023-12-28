import { memo, useCallback } from "react"
import { Image, Pressable, StyleProp, ViewStyle } from "react-native"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useTheme } from "../engine/hooks"

export const AboutIconButton = memo(({
    title,
    description,
    style,
    size = 16
}: {
    title: string,
    description: string,
    style: StyleProp<ViewStyle>,
    size?: number
}) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const onPressed = useCallback(() => {
        navigation.navigateAlert({ title, message: description });
    }, [title, description]);

    return (
        <Pressable
            onPress={onPressed}
            style={({ pressed }) => ([
                {
                    opacity: pressed ? 0.8 : 1,
                    position: 'absolute', top: 2, right: 0, left: 6, bottom: 0
                },
                style
            ])}
        >
            <Image
                source={require('@assets/ic-info-round.png')}
                height={size} width={size}
                style={{ height: size, width: size, tintColor: theme.iconPrimary }}
            />
        </Pressable>
    )
})