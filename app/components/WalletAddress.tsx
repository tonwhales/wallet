import React from "react";
import { useTranslation } from "react-i18next";
import { StyleProp, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { Theme } from "../Theme";
import { ActionsMenuView } from "./ActionsMenuView";

export const WalletAddress = React.memo((props: {
    address: string,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps
}) => {
    const { t } = useTranslation();
    return (
        <ActionsMenuView title={t('common.walletAddress')} content={props.value ? props.value : props.address} style={props.style}>
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
        </ActionsMenuView>
    );
})