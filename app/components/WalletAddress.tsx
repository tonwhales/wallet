import React from "react";
import { StyleProp, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { MenuComponent } from "./MenuComponent";

export const WalletAddress = React.memo((props: {
    address: string,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps,
    actions?: { title: string, id: string, image?: string, attributes?: { destructive: boolean }, onAction: (content?: string) => void }[]
}) => {
    return (
        <MenuComponent
            title={t('common.walletAddress')}
            content={props.value ? props.value : props.address}
            style={props.style}
            actions={props.actions}
        >
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
        </MenuComponent>
    );
})