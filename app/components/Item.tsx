import * as React from 'react';
import { ImageSourcePropType, Pressable, Text, View, Image } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useAppConfig } from '../utils/AppConfigContext';

export const Item = React.memo((props: { title?: string, hint?: string, onPress?: () => void, backgroundColor?: string, textColor?: string }) => {
    const { Theme } = useAppConfig();
    return (
        <Pressable style={({ pressed }) => ({ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: pressed ? Theme.background : props.backgroundColor || Theme.item, justifyContent: 'center' })} disabled={!props.onPress} onPress={props.onPress}>
            <Text style={{ fontSize: 18, color: props.onPress ? props.textColor || Theme.accentDark : props.textColor || Theme.textColor, flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
            {!!props.hint && (
                <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                    <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: Theme.textSecondary }}>{props.hint}</Text>
                </View>
            )}
        </Pressable>
    )
});

export const ItemSwitch = React.memo((props: {
    title?: string,
    value: boolean,
    onChange: (value: boolean) => void,
    leftIcon?: ImageSourcePropType,
    leftIconComponent?: any,
}) => {
    const { Theme } = useAppConfig();
    return (
        <View style={{ flexGrow: 1, alignItems: 'center', flexDirection: 'row', padding: 20, justifyContent: 'space-between' }}>
            {props.leftIcon && (<Image style={{ height: 24, width: 24 }} source={props.leftIcon} />)}
            {!!props.leftIconComponent && (
                <View style={{ height: 24, width: 24, justifyContent: 'center', alignItems: 'center' }}>
                    {props.leftIconComponent}
                </View>
            )}
            <Text
                style={{
                    fontSize: 17, lineHeight: 24,
                    fontWeight: '600',
                    textAlignVertical: 'center',
                    flexShrink: 1
                }}
            >
                {props.title}
            </Text>
            <Switch
                trackColor={{
                    false: Theme.mediumGrey,
                    true: Theme.accent,
                }}
                value={props.value}
                onValueChange={props.onChange}
            />
        </View>
    )
});