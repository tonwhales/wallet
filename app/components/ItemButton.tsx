import * as React from 'react';
import { Pressable, View, Text, Image, ImageSourcePropType } from 'react-native';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemButton = React.memo((props: {
    title?: string,
    hint?: string,
    onPress?: () => void,
    dangerZone?: boolean,
    leftIcon?: ImageSourcePropType,
    leftIconComponent?: any,
}) => {
    const { Theme } = useAppConfig();
    return (
        <Pressable style={(props) => ({ opacity: props.pressed ? 0.3 : 1, flexDirection: 'row', alignItems: 'center' })} onPress={props.onPress}>
            <View style={{
                height: 48,
                paddingLeft: (props.leftIcon || props.leftIconComponent) ? 8 : 16,
                paddingRight: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', flexGrow: 1, flexBasis: 0
            }}>
                <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
                    {props.leftIcon && (<Image style={{ height: 24, width: 24 }} source={props.leftIcon} />)}
                    {!!props.leftIconComponent && (
                        <View style={{ height: 24, width: 24, justifyContent: 'center', alignItems: 'center' }}>
                            {props.leftIconComponent}
                        </View>
                    )}
                    <Text
                        style={{
                            fontSize: 17,
                            textAlignVertical: 'center',
                            color: props.dangerZone ? "#FF0000" : Theme.textColor,
                            marginLeft: 13,
                            lineHeight: 24,
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {props.title}
                    </Text>
                </View>
                {props.hint && (
                    <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                        <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: Theme.textSecondary }}>
                            {props.hint}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    )
});