import * as React from 'react';
import { View } from 'react-native';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { fragment } from '../../fragment';
import { useReboot } from '../../Root';
import { doInitialSync } from '../../sync/initialSync';

export const SyncFragment = fragment(() => {
    const reboot = useReboot();
    React.useEffect(() => {
        let ended = false;
        (async () => {
            if (ended) {
                return;
            }
            await doInitialSync();
            if (ended) {
                return;
            }
            reboot();
        })();
        return () => {
            ended = true;
        };
    }, []);
    return (
        <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingIndicator />
        </View>
    );
});