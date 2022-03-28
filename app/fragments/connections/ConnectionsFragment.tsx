import axios from 'axios';
import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../../components/ItemButton';
import { fragment } from "../../fragment";
import { t } from '../../i18n/t';
import { addPendingRevoke, getConnectionReferences, removeConnectionReference, removePendingRevoke } from "../../storage/appState";
import { Theme } from '../../Theme';
import { formatDate } from '../../utils/dates';
import { backoff } from '../../utils/time';

export const ConnectionsFragment = fragment(() => {
    let [apps, setApps] = React.useState(getConnectionReferences());
    let disconnectApp = React.useCallback((src: string) => {

        let refs = getConnectionReferences();
        let ex = refs.find((v) => v.key === src);
        if (!ex) {
            return;
        }

        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [
            {
                text: t('common.cancel')
            },
            {
                text: t('auth.revoke.action'), style: 'destructive', onPress: () => {
                    addPendingRevoke(src);
                    removeConnectionReference(src);
                    setApps((a) => a.filter((v) => v.key !== src));
                    backoff(async () => {
                        await axios.post('https://connect.tonhubapi.com/connect/revoke', { key: src }, { timeout: 5000 });
                        removePendingRevoke(src);
                    });
                }
            }
        ]);

    }, []);
    if (apps.length === 0) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, textAlign: 'center', color: Theme.textSecondary }}>{t('auth.noApps')}</Text>
            </View>
        )
    }

    return (
        <ScrollView>
            <View style={{
                marginBottom: 16, marginTop: 17,
                marginHorizontal: 16,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                {apps.map((app) => (
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={app.name} hint={formatDate(Math.floor(app.date / 1000))} onPress={() => disconnectApp(app.key)} />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
});