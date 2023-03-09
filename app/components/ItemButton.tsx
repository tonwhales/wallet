import * as React from 'react';
import { Pressable, View, Text, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Theme } from '../Theme';

export const ItemButton = React.memo((props: {
    title?: string,
    hint?: string,
    onPress?: () => void,
    dangerZone?: boolean,
    leftIconSource?: ImageSourcePropType,
    rightIconSource?: ImageSourcePropType,
    rightIcon?: {
        icon: React.FC<SvgProps>,
        color?: string,
        height?: number,
        width?: number,
        style?: StyleProp<ViewStyle>
    },
    leftIcon?: {
        icon: React.FC<SvgProps>,
        color?: string,
        height?: number,
        width?: number,
        style?: StyleProp<ViewStyle>
    },
}) => {
    return (
        <Pressable style={(props) => ({ opacity: props.pressed ? 0.3 : 1, flexDirection: 'row', alignItems: 'center' })} onPress={props.onPress}>
            <View style={{ height: 48, paddingLeft: props.leftIconSource ? 8 : 16, paddingRight: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexGrow: 1, flexBasis: 0 }}>
                <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
                    {props.leftIconSource && (<Image style={{ height: 24, width: 24 }} source={props.leftIconSource} />)}
                    {props.leftIcon && (
                        <props.leftIcon.icon
                            color={props.leftIcon.color}
                            height={props.leftIcon.height}
                            width={props.leftIcon.width}
                            style={props.leftIcon.style}
                        />
                    )}
                    <Text
                        style={{
                            fontSize: 17,
                            textAlignVertical: 'center',
                            color: props.dangerZone ? "#FF0000" : Theme.textColor,
                            marginLeft: props.leftIconSource ? 13 : 0,
                            lineHeight: 24,
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {props.title}
                    </Text>
                </View>
                {props.hint && (
                    <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 17, textAlignVertical: 'center', color: Theme.textSecondary }}>
                            {props.hint}
                        </Text>
                    </View>
                )}
                {props.rightIconSource && (<Image style={{ height: 24, width: 24 }} source={props.rightIconSource} />)}
                {props.rightIcon && (
                    <props.rightIcon.icon
                        color={props.rightIcon.color}
                        height={props.rightIcon.height}
                        width={props.rightIcon.width}
                        style={props.rightIcon.style}
                    />
                )}
            </View>
        </Pressable>
    )
});