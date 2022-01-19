import { t } from 'i18next';
import * as React from 'react';
import { Text, View } from 'react-native';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { fragment } from '../fragment';
import { useReboot } from '../Root';
import { getAppState } from '../storage/appState';
import { doInitialSync } from '../sync/initialSync';

export const SyncFragment = fragment(() => {
    const reboot = useReboot();
    React.useEffect(() => {
        let ended = false;
        (async () => {
            if (ended) {
                return;
            }
            await doInitialSync(getAppState()!);
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
            <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>{t("Downloading wallet data...")}</Text>
        </View>
    );
});