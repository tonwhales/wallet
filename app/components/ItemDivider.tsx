import * as React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemDivider = React.memo(({ marginHorizontal, marginVertical }: { marginHorizontal?: number, marginVertical?: number }) => {
    const { Theme } = useAppConfig();
    return (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginHorizontal: marginHorizontal ?? 20, marginVertical: marginVertical ?? 16 }} />);
});