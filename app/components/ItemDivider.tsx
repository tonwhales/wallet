import * as React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemDivider = React.memo(() => {
    const { Theme } = useAppConfig();
    return (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />);
});