import React from "react";
import { Pressable, Image, StyleProp, ViewStyle } from "react-native";

export const CloseButton = React.memo((props: { onPress?: () => void, style?: StyleProp<ViewStyle> }) => {
    const [closePressedIn, setClosePressedIn] = React.useState(false);

    return (
        <Pressable
            onPressIn={() => setClosePressedIn(true)}
            onPressOut={() => setClosePressedIn(false)}
            style={[props.style, { opacity: closePressedIn ? 0.5 : 1 }]}
            onPress={props.onPress}
        >
            <Image source={require('../../assets/ic_close.png')} />
        </Pressable>
    )
})