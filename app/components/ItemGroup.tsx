import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemGroup = React.memo((props: { children?: any, style?: StyleProp<ViewStyle> }) => {
    const { Theme } = useAppConfig();
    return (
        <View
            style={[{
                backgroundColor: Theme.item,
                overflow: 'hidden',
                borderRadius: 14,
                alignItems: 'stretch',
                flexDirection: 'column',
            }, props.style]}
        >
            {props.children}
        </View>
    )
});