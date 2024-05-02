import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../engine/hooks';

export const ItemGroup = React.memo((props: { children?: any, style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme();
    return (
        <View
            style={[{
                backgroundColor: theme.surfaceOnElevation,
                overflow: 'hidden',
                borderRadius: 20,
                alignItems: 'stretch',
                flexDirection: 'column',
                paddingHorizontal: 10,
                paddingVertical: 20
            }, props.style]}
        >
            {props.children}
        </View>
    )
});