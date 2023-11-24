import * as React from 'react';
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../engine/hooks';
import { memo } from 'react';

export const ItemHeader = memo((props: { title: string, loading?: boolean, style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme()
    return (
        <View style={[{ flexDirection: 'row' }, props.style]}>
            <Text
                style={{
                    fontSize: 17, lineHeight: 24,
                    textAlignVertical: 'center',
                    color: theme.textPrimary,
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