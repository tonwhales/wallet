import * as React from 'react';
import { Text, View } from 'react-native';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { fragment } from '../fragment';
import { t } from '../i18n/t';
import { EngineContext } from '../sync/Engine';
import { useReboot } from '../utils/RebootContext';

export const SyncFragment = fragment(() => {
    const reboot = useReboot();
    const engine = React.useContext(EngineContext)!
    React.useEffect(() => {
        let ended = false;
        (async () => {
            if (ended) {
                return;
            }
            await engine.awaitReady();
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
            <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>{t('wallet.sync')}</Text>
        </View>
    );
});