import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import React from "react";
import { StyleProp, View, ViewStyle, Text, TextProps, Pressable } from "react-native";
import { Theme } from "../../../Theme";

export const gradientColorsMap = [
    ['#E4E4EB', '#F0E0FF'],
    ['#E4E4EB', '#CFEFD6'],
    ['#E4E4EB', '#FFC6AD'],
];

export const CardProductButton = React.memo((
    {
        height, width,
        style,
        title,
        description,
        gradientColors,
        descriptionTextProps,
        onPress,
        onLongPress,
        icon,
        balance,
        button
    }: {
        height: number, width: number,
        style?: StyleProp<ViewStyle>,
        title?: string,
        description?: string,
        gradientColors?: string[],
        descriptionTextProps?: TextProps,
        onPress?: () => void,
        onLongPress?: () => void,
        icon?: any,
        balance?: any,
        button?: {
            title: string,
            color: string,
            textColor: string
        }
    }
) => {
    return (
        <Pressable
            style={({ pressed }) => {
                return ([{
                    height, width,
                    borderRadius: 20,
                    overflow: 'hidden',
                    padding: 14,
                    opacity: pressed ? 0.3 : 1,
                }, style]);
            }}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <Canvas style={{ width, height, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Rect x={0} y={0} width={height} height={width}>
                    <LinearGradient
                        start={vec(width, 0)}
                        end={vec(0, height)}
                        colors={gradientColors ? gradientColors : gradientColorsMap[0]}
                    />
                </Rect>
            </Canvas>
            {!!title && (
                <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: Theme.textColor
                }}>
                    {title}
                </Text>
            )}
            {!!description && (
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '400',
                        marginTop: 8,
                        color: Theme.textColor
                    }}
                    numberOfLines={3}
                    ellipsizeMode={'tail'}
                    {...descriptionTextProps}
                >
                    {description}
                </Text>
            )}
            {(!!icon || !!balance) && (
                <View style={{ position: 'absolute', bottom: 14, right: 14, left: 14, justifyContent: 'space-between' }}>
                    {!!balance && (
                        <View style={{}}>
                            {balance}
                        </View>
                    )}
                    {!!icon && (
                        <View style={{alignSelf: 'flex-end'}}>
                            {icon}
                        </View>
                    )}
                </View>
            )}
            {!!button && (
                <View style={{
                    backgroundColor: button.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 20,
                    position: 'absolute', bottom: 14, right: 14, left: 14,
                    paddingVertical: 14, paddingHorizontal: 2
                }}>
                    <Text style={{
                        color: button.textColor,
                        fontSize: 16,
                        fontWeight: '700',
                    }}>
                        {button.title}
                    </Text>
                </View>
            )}
        </Pressable>
    );
});