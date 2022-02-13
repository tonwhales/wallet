import React from "react";
import { StyleProp, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { Theme } from "../Theme";
import { CopyView } from "./CopyView";

export const WalletAddress = React.memo((props: {
    address: string,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps
}) => {
    return (
        <CopyView content={props.value ? props.value : props.address} style={props.style}>
            <Text
                selectable={false}
                numberOfLines={1}
                ellipsizeMode={'middle'}
                {...props.textProps}
            >
                <Text style={[
                    {
                        fontSize: 16,
                        fontWeight: '700',
                        textAlign: 'center',
                        color: Theme.textColor
                    },
                    props.textStyle
                ]}>
                    {props.address}
                </Text>
            </Text>
        </CopyView>
    );
})