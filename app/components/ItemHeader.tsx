import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Theme } from '../Theme';

export const ItemHeader = React.memo((props: { title: string, loading?: boolean }) => {
    return (
        <View style={{ height: 48, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row' }}>
            <Text style={{ fontSize: 20, height: 26, textAlignVertical: 'center', color: Theme.textColor, fontWeight: '600', flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
            {props.loading && (<ActivityIndicator />)}
        </View>
    )
});