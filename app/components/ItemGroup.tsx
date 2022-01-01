import * as React from 'react';
import { View } from 'react-native';
import { Theme } from '../Theme';

export const ItemGroup = React.memo((props: { children?: any }) => {
    return (
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: Theme.divider, marginHorizontal: 16 }}>
            {props.children}
        </View>
    )
});