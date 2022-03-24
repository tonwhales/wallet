import * as React from 'react';
import { Text, View } from 'react-native';
import { fragment } from "../../fragment";
import { getConnectionReferences } from "../../storage/appState";
import { Theme } from '../../Theme';

export const ConnectionsFragment = fragment(() => {
    let [apps, setApps] = React.useState(getConnectionReferences());
    if (apps.length === 0) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, textAlign: 'center', color: Theme.textSecondary }}>No connected apps</Text>
            </View>
        )
    }

    return (
        <View></View>
    );
});