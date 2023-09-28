import { memo, useCallback } from "react"
import { Alert, Pressable, StyleProp, ViewStyle } from "react-native"

import IcInfo from '@assets/ic-info.svg'
import { useTypedNavigation } from "../utils/useTypedNavigation"

export const AboutIconButton = memo(({
    title,
    description,
    style
}: {
    title: string,
    description: string,
    style: StyleProp<ViewStyle>
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
                height={16} width={16}
                style={{ height: 16, width: 16 }}
            />
        </Pressable>
    )
})