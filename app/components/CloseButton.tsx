import React, { useMemo } from "react";
import { Pressable, Image, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../engine/hooks";
import { ThemeStyle } from "../engine/state/theme";

export const CloseButton = React.memo((props: { onPress?: () => void, style?: StyleProp<ViewStyle>, dark?: boolean }) => {
    const theme = useTheme();
    const dark = useMemo(() => {
        if (dark !== undefined) {
            return props.dark;
        } else {
            return theme.style === ThemeStyle.Dark;
        }
    }, [props.dark])

    return (
        <Pressable
            style={({ pressed }) => { return [props.style, { opacity: pressed ? 0.5 : 1 }] }}
            onPress={props.onPress}
        >
            <Image source={!dark ? require('../../assets/ic_close.png') : require('../../assets/ic_close_dark.png')} />
        </Pressable>
    )
})