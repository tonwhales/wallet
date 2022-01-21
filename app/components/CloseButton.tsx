import React from "react";
import { Pressable, Image, StyleProp, ViewStyle } from "react-native";

export const CloseButton = React.memo((props: { onPress?: () => void, style?: StyleProp<ViewStyle>, dark?: boolean }) => {

    return (
        <Pressable
            style={({ pressed }) => { return [props.style, { opacity: pressed ? 0.5 : 1 }] }}
            onPress={props.onPress}
        >
            <Image source={props.dark ? require('../../assets/ic_close.png'): require('../../assets/ic_close_dark.png')} />
        </Pressable>
    )
})