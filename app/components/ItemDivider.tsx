import * as React from 'react';
import { View } from 'react-native';
import { useTheme } from '../engine/hooks/useTheme';

export const ItemDivider = React.memo(() => {
    const theme = useTheme();
    return (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 16 }} />);
});