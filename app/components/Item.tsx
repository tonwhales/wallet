import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useTheme } from '../engine/hooks';

export const Item = React.memo((props: { title?: string, hint?: string, onPress?: () => void, backgroundColor?: string, textColor?: string }) => {
    const theme = useTheme();
    return (
        <Pressable style={({ pressed }) => ({ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: pressed ? theme.background : props.backgroundColor || theme.item, justifyContent: 'center' })} disabled={!props.onPress} onPress={props.onPress}>
            <Text style={{ fontSize: 18, color: props.onPress ? props.textColor || theme.accentDark : props.textColor || theme.textColor, flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
            {!!props.hint && (
                <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                    <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: theme.textSecondary }}>{props.hint}</Text>
                </View>
            )}
        </Pressable>
    )
});

export const ItemSwitch = React.memo((props: { title?: string, value: boolean, onChange: (value: boolean) => void }) => {
    const theme = useTheme();
    return (
        <View style={{ height: 44, paddingHorizontal: 16, backgroundColor: theme.item, alignItems: 'center', flexDirection: 'row' }}>
            <Text style={{ fontSize: 18, color: theme.textColor, flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
            <Switch
                // trackColor={theme.accent}
                value={props.value}
                onValueChange={props.onChange}
            />
        </View>
    )
});