import { memo, useState } from "react"
import { Pressable, StyleProp, ViewStyle, Text, TextStyle } from "react-native";

export const PressableChip = memo(({
    onPress,
    style,
    text,
    textStyle
}: {
    onPress: () => void,
    style?: StyleProp<ViewStyle>,
    text: string,
    textStyle?: StyleProp<TextStyle>
}) => {
    const [pressedIn, setPressedIn] = useState(false);
    return (
        <Pressable
            onPressIn={() => setPressedIn(true)}
            onPressOut={() => setPressedIn(false)}
            style={[
                {
                    marginRight: 8,
                    paddingHorizontal: 17, paddingVertical: 4,
                    borderRadius: 20,
                    height: 28,
                    transform: [{ scale: pressedIn ? 0.97 : 1 }]
                },
                style,
            ]}
            onPress={onPress}
        >
            <Text style={[
                {
                    fontWeight: '400',
                    fontSize: 15, lineHeight: 20,
                    textAlign: 'center', textAlignVertical: 'center',
                },
                textStyle
            ]}>
                {text}
            </Text>
        </Pressable>
    )
})