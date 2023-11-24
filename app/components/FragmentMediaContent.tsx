import React from "react"
import { ImageSourcePropType, StyleProp, View, ViewStyle, Text, useWindowDimensions, Image } from "react-native";
import LottieView from 'lottie-react-native';
import { useTheme } from '../engine/hooks';

interface AnimationObject {
    v: string;
    fr: number;
    ip: number;
    op: number;
    w: number;
    h: number;
    nm: string;
    ddd: number;
    assets: any[];
    layers: any[];
}

export const FragmentMediaContent = React.memo((props: {
    title?: string,
    text?: string,
    animation?: string | AnimationObject | { uri: string },
    style?: StyleProp<ViewStyle>,
    image?: ImageSourcePropType,
    children?: any
}) => {
    const theme = useTheme();
    const { height } = useWindowDimensions();

    return (
        <View style={[{
            justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 25
        }, props.style]}>
            {props.animation && (
                <LottieView
                    source={props.animation}
                    autoPlay={true}
                    loop={true}
                    style={{ width: height * 0.15, height: height * 0.15, marginBottom: 8, maxWidth: 140, maxHeight: 140 }}
                />
            )}
            {props.image && (
                <View style={{ width: height * 0.15, height: height * 0.15, marginBottom: 8, maxWidth: 140, maxHeight: 140, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={props.image} />
                </View>
            )}
            {(props.title && props.title.length > 0) && (
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    textAlign: 'center',
                    marginTop: 26,
                    color: theme.textPrimary
                }}>
                    {props.title}
                </Text>
            )}
            {(props.text && props.text.length > 0) && (
                <Text style={{
                    textAlign: 'center',
                    color: theme.textThird,
                    fontSize: 14,
                    marginTop: 14,
                    flexShrink: 1,
                }}>
                    {props.text}
                </Text>
            )}
            {props.children}
        </View>
    );
})