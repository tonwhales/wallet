import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import { SvgProps } from "react-native-svg";

export const IconButton = React.memo(({
    icon,
    disabled,
    color,
    height,
    width,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    children,
    style
}: {
    icon: React.FC<SvgProps>,
    disabled?: boolean,
    color?: string,
    height?: number,
    width?: number
    onPress?: () => void,
    onPressIn?: () => void,
    onPressOut?: () => void,
    onLongPress?: () => void,
    children?: any,
    style?: StyleProp<ViewStyle>
}) => {
    const Icon = icon;
    return (
        <Pressable
            disabled={disabled}
            style={({ pressed }) => {
                return [{
                    opacity: (pressed || disabled) ? 0.3 : 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }, style]
            }}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onLongPress={onLongPress}
        >
            <Icon color={color} height={height} width={width} />
            {children}
        </Pressable>
    );
})