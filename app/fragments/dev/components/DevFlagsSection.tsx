import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { ItemButton } from '../../../components/ItemButton';
import { whalesConnectEndpoint } from '../../../engine/clients';
import { WHALES_CONNECT_DEFAULT_ENDPOINT, whalesConnectOverrideKey } from '../../../engine/endpoints';
import { FLAG_DEFAULTS, FlagKey } from '../../../engine/flags/flagRegistry';
import { resolveFlagValue } from '../../../engine/flags/resolveFlagValue';
import { useFlagsSnapshot } from '../../../engine/hooks/flags';
import { storage } from '../../../storage/storage';

const itemStyle = { marginHorizontal: 16, width: '100%' } as const;

const RESTART_NOTE = 'Restart the app to apply the change.';

function saveEndpoint(value: string | undefined) {
    if (value) {
        storage.set(whalesConnectOverrideKey, value);
    } else {
        storage.delete(whalesConnectOverrideKey);
    }
    Alert.alert('Whales Connect endpoint', RESTART_NOTE);
}

function onChangeEndpoint() {
    if (Platform.OS === 'ios') {
        Alert.prompt(
            'Whales Connect endpoint',
            `Default: ${WHALES_CONNECT_DEFAULT_ENDPOINT}. Empty value resets to the default.`,
            (value) => saveEndpoint(value.trim() || undefined),
            'plain-text',
            whalesConnectEndpoint
        );
        return;
    }
    Alert.alert('Whales Connect endpoint', `Reset to ${WHALES_CONNECT_DEFAULT_ENDPOINT}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => saveEndpoint(undefined) }
    ]);
}

export const DevFlagsSection = React.memo(() => {
    const snapshot = useFlagsSnapshot();
    const now = Date.now();
    const keys = Object.keys(FLAG_DEFAULTS) as FlagKey[];

    return (
        <>
            <View style={itemStyle}>
                <ItemButton title={'Whales Connect endpoint'} onPress={onChangeEndpoint} hint={whalesConnectEndpoint} />
            </View>
            {keys.map((key) => (
                <View key={key} style={itemStyle}>
                    <ItemButton
                        title={`Flag: ${key}`}
                        hint={`${String(resolveFlagValue(key, snapshot, now))}${snapshot ? '' : ' (default)'}`}
                    />
                </View>
            ))}
        </>
    );
});
