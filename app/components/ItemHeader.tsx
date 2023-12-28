import * as React from 'react';
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../engine/hooks';
import { memo } from 'react';
import { Typography } from './styles';

export const ItemHeader = memo((props: { title: string, loading?: boolean, style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme()
    return (
        <View style={[{ flexDirection: 'row' }, props.style]}>
            <Text
                style={[{
                    textAlignVertical: 'center',
                    color: theme.textPrimary,
                    flexGrow: 1,
                }, Typography.semiBold17_24]}
            >
                {props.title}
            </Text>
            {props.loading && (<ActivityIndicator />)}
        </View>
    )
});