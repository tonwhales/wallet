import * as React from 'react';
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemHeader = React.memo((props: { title: string, loading?: boolean, style?: StyleProp<ViewStyle> }) => {
    const { Theme } = useAppConfig();
    return (
        <View style={[{ flexDirection: 'row' }, props.style]}>
            <Text
                style={{
                    fontSize: 17, lineHeight: 24,
                    textAlignVertical: 'center',
                    color: Theme.textPrimary,
                    fontWeight: '600',
                    flexGrow: 1,
                }}
            >
                {props.title}
            </Text>
            {props.loading && (<ActivityIndicator />)}
        </View>
    )
});