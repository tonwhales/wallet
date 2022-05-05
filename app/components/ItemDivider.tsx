import * as React from 'react';
import { View } from 'react-native';
import { Theme } from '../Theme';

export const ItemDivider = React.memo(() => {
    return (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />);
});