import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import CheckMark from '../../assets/ic_check_mark.svg';
import { useTheme } from '../engine/hooks';
import { Typography } from "./styles";

export const CheckBox = React.memo((
    {
        checked,
        text,
        onToggle,
        style,
        inactiveColor = '#CBCBCB',
        activeOpacity = 0.3
    }: {
        checked?: boolean,
        text?: any,
        onToggle?: (newVal: boolean) => void,
        style?: StyleProp<ViewStyle>,
        inactiveColor?: string,
        activeOpacity?: number
    }
) => {
    const theme = useTheme();
    const [isChecked, setIsChecked] = useState(checked);

    const toggle = useCallback(
        () => {
            setIsChecked(!isChecked);
            if (onToggle) {
                onToggle(!isChecked);
            }
        },
        [isChecked],
    );

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    return (
        <Pressable
            onPress={toggle}
            style={({ pressed }) => {
                return [{
                    opacity: pressed ? activeOpacity : 1
                }, style]
            }}
        >
            <View style={[{
                flexDirection: 'row',
            }]}>
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 24, width: 24, borderRadius: 4,
                    backgroundColor: isChecked ? theme.accent : inactiveColor
                }}>
                    {isChecked && <CheckMark />}
                </View>
                <Text style={[{
                    marginLeft: 16,
                    color: theme.textPrimary
                }, Typography.regular15_20]}>
                    {text}
                </Text>
            </View>
        </Pressable>
    );
})