import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export const ItemGroup = React.memo((props: { children?: any, style?: StyleProp<ViewStyle> }) => {
    return (
        <View
            style={[{
                backgroundColor: "white",
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