import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import CheckMark from '../../assets/ic_check_mark.svg';
import { useTheme } from '../engine/hooks';

export const CheckBox = React.memo((
    {
        checked,
        text,
        onToggle,
        style
    }: {
        checked?: boolean,
        text?: any,
        onToggle?: (newVal: boolean) => void,
        style?: StyleProp<ViewStyle>
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
                    opacity: pressed ? 0.3 : 1
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
                    backgroundColor: isChecked ? theme.accent : '#CBCBCB'
                }}>
                    {isChecked && <CheckMark />}
                </View>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    marginLeft: 16,
                    color: theme.textPrimary
                }}>
                    {text}
                </Text>
            </View>
        </Pressable>
    );
})