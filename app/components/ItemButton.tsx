import * as React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Theme } from '../Theme';

export const ItemButton = React.memo((props: {
    title?: string,
    hint?: string,
    onPress?: () => void
}) => {
    return (
        <Pressable style={(props) => ({ opacity: props.pressed ? 0.3 : 1 })} onPress={props.onPress}>
            <View style={{ height: 48, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center', flexDirection: 'row' }}>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                    <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: Theme.textColor }}>{props.title}</Text>
                </View>
                {props.hint && (
                    <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                        <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: Theme.textSecondary }}>{props.hint}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    )
});