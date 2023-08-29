import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../engine/hooks/useTheme';

export const ItemGroup = React.memo((props: { children?: any, style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme();
    return (
        <View
            style={[{
                backgroundColor: theme.item,
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