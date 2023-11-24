import { memo, useCallback } from "react"
import { Pressable, StyleProp, ViewStyle } from "react-native"
import { useTypedNavigation } from "../utils/useTypedNavigation"

import IcInfo from '@assets/ic-info.svg'

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
            <IcInfo
                height={size} width={size}
                style={{ height: size, width: size }}
            />
        </Pressable>
    )
})