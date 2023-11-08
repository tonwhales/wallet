import * as React from 'react';
import { View } from 'react-native';
import { useTheme } from '../engine/hooks';

export const ItemDivider = React.memo(({ marginHorizontal, marginVertical }: { marginHorizontal?: number, marginVertical?: number }) => {
    const theme = useTheme();
    return (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginHorizontal: marginHorizontal ?? 20, marginVertical: marginVertical ?? 16 }} />);
});