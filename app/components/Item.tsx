import * as React from 'react';
import { ImageSourcePropType, Pressable, Text, View, Image, Platform, StyleProp, TextStyle } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useTheme } from '../engine/hooks';
import { memo } from 'react';
import { Typography } from './styles';

export const Item = memo((props: { title?: string, hint?: string, onPress?: () => void, backgroundColor?: string, textColor?: string }) => {
    const theme = useTheme();
    return (
        <Pressable
            style={({ pressed }) => ({
                height: 44,
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16,
                backgroundColor: pressed
                    ? theme.backgroundPrimary
                    : (props.backgroundColor || theme.surfaceOnBg)
                , justifyContent: 'center'
            })}
            disabled={!props.onPress}
            onPress={props.onPress}
        >
            <Text style={{
                fontSize: 18,
                color: props.onPress
                    ? (props.textColor || theme.accent)
                    : (props.textColor || theme.textPrimary),
                flexGrow: 1, flexBasis: 0
            }}>{props.title}</Text>
            {!!props.hint && (
                <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                    <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: theme.textSecondary }}>{props.hint}</Text>
                </View>
            )}
        </Pressable>
    )
});

export const ItemSwitch = memo((props: {
    title?: string,
    value: boolean,
    onChange: (value: boolean) => void,
    leftIcon?: ImageSourcePropType,
    leftIconComponent?: any,
    titleStyle?: StyleProp<TextStyle>
    disabled?: boolean,
}) => {
    const theme = useTheme();
    return (
        <Pressable
            onPress={() => {
                props.onChange(!props.value);
            }}
            style={[
                {
                    flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    flexDirection: 'row',
                    padding: 20,
                    minHeight: 72
                },
                Platform.select({ android: { opacity: props.disabled ? 0.8 : 1 } }),
            ]}
            disabled={props.disabled}
        >
            <View style={{ flexDirection: 'row', flexShrink: 1, alignItems: 'center' }}>
                {props.leftIcon && (<Image style={{ height: 24, width: 24, marginRight: 13 }} source={props.leftIcon} />)}
                {!!props.leftIconComponent && (
                    <View style={{ height: 24, width: 24, justifyContent: 'center', alignItems: 'center', marginRight: 13 }}>
                        {props.leftIconComponent}
                    </View>
                )}
                <Text
                    style={[
                        { textAlignVertical: 'center', flexShrink: 1, color: theme.textPrimary, marginRight: 4 },
                        Typography.semiBold17_24,
                        props.titleStyle
                    ]}
                >
                    {props.title}
                </Text>
            </View>
            <Switch
                trackColor={{
                    false: theme.divider,
                    true: theme.accentDisabled,
                }}
                thumbColor={(Platform.OS === 'android' && props.value) ? theme.accentDisabled : undefined}
                pointerEvents={'none'}
                value={props.value}
                onValueChange={props.onChange}
                disabled={props.disabled}
            />
        </Pressable>
    )
});