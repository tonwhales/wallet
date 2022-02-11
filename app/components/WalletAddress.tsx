import React from "react";
import { Platform, Pressable, StyleProp, Text, TextProps, TextStyle, ToastAndroid, ViewStyle } from "react-native";
import { Theme } from "../Theme";
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from "react-i18next";

export const WalletAddress = React.memo((props: {
    address: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps
}) => {
    const { t } = useTranslation();

    if (Platform.OS === 'ios') {
        return (
            <Text
                selectable={true}
                style={[{ marginTop: 25, width: 265, textAlign: 'center' }, props.style]}
                numberOfLines={1}
                ellipsizeMode={"middle"}
                {...props.textProps}
            >
                <Text
                    style={[
                        { fontSize: 16, fontWeight: '700', color: Theme.textColor },
                        props.textStyle
                    ]}>
                    {props.address}
                </Text>
            </Text>
        )
    }

    const onCopy = React.useCallback(() => {
        Clipboard.setString(props.address);
        ToastAndroid.show(t('Wallet address copied'), ToastAndroid.SHORT);
    }, [props.address]);

    return (
        <Pressable onLongPress={onCopy} style={({ pressed }) => {
            return [{ opacity: pressed ? 0.5 : 1, marginTop: 25, width: 265 }, props.style]
        }}>
            <Text
                selectable={true}
                numberOfLines={1}
                ellipsizeMode={'middle'}
                {...props.textProps}
            >
                <Text style={[
                    {
                        fontSize: 16,
                        fontWeight: '700',
                        textAlign: 'center',
                        color: Theme.textColor,
                        fontFamily: 'monospace',
                    },
                    props.textStyle
                ]}>
                    {props.address}
                </Text>
            </Text>
        </Pressable>
    );
})