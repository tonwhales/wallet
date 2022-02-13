import React from "react";
import { StyleProp, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { Theme } from "../Theme";
import { useTranslation } from "react-i18next";
import { CopyView } from "./CopyView";

export const WalletAddress = React.memo((props: {
    address: string,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps
}) => {
    const { t } = useTranslation();

    // address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(0, 10)
    //     + '...'
    //     + address.toFriendly({ testOnly: AppConfig.isTestnet }).slice(t.length - 6)

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

    // if (Platform.OS === 'ios') {
    //     return (
    //         <Text
    //             selectable={true}
    //             style={[{ marginTop: 25, width: 265, textAlign: 'center' }, props.style]}
    //             numberOfLines={1}
    //             ellipsizeMode={"middle"}
    //             {...props.textProps}
    //         >
    //             <Text
    //                 style={[
    //                     { fontSize: 16, fontWeight: '700', color: Theme.textColor },
    //                     props.textStyle
    //                 ]}>
    //                 {props.address}
    //             </Text>
    //         </Text>
    //     )
    // }

    // const onCopy = React.useCallback(() => {
    //     Clipboard.setString(props.address);
    //     ToastAndroid.show(t('Wallet address copied'), ToastAndroid.SHORT);
    // }, [props.address]);

    // return (
    //     <Pressable onLongPress={onCopy} style={({ pressed }) => {
    //         return [{ opacity: pressed ? 0.5 : 1, marginTop: 25, width: 265 }, props.style]
    //     }}>
    //         <Text
    //             selectable={true}
    //             numberOfLines={1}
    //             ellipsizeMode={'middle'}
    //             {...props.textProps}
    //         >
    //             <Text style={[
    //                 {
    //                     fontSize: 16,
    //                     fontWeight: '700',
    //                     textAlign: 'center',
    //                     color: Theme.textColor,
    //                     fontFamily: 'monospace',
    //                 },
    //                 props.textStyle
    //             ]}>
    //                 {props.address}
    //             </Text>
    //         </Text>
    //     </Pressable>
    // );
})