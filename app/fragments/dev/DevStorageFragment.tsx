import * as React from 'react';
import { View } from 'react-native';
import { Item } from '../../components/Item';
import { fragment } from '../../fragment';
import { getApplicationKey, getBiometricsMigrated, getBiometricsState, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { getCurrentAddress } from '../../storage/appState';
import { getPasscodeState } from '../../components/secure/AuthWalletKeys';
import { ItemButton } from '../../components/ItemButton';
import { ScrollView } from 'react-native-gesture-handler';
import { Address } from 'ton';
import { ItemGroup } from '../../components/ItemGroup';

function loadStorageState(isTestnet: boolean) {
    const account = getCurrentAddress();
    const storedBiometricsMigrated = getBiometricsMigrated(isTestnet);
    const biometricsState = getBiometricsState(account.address.toFriendly({ testOnly: isTestnet }));
    const passcodeState = getPasscodeState(account.address, isTestnet);
    return {
        migrated: storedBiometricsMigrated,
        biometricsState,
        passcodeState,
    }
}

export const DevStorageFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();

    let [value, setValue] = React.useState('');

    const initialState = loadStorageState(AppConfig.isTestnet);
    const [keysStorageState, setKeysStorageState] = React.useState(initialState);

    React.useEffect(() => {
        (async () => {
            try {
                await getApplicationKey();
                setValue('ok');
            } catch (e) {
                console.warn(e);
                setValue('error');
            }
        })();
    }, []);
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();

    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, paddingHorizontal: 16 }}>
                <ItemGroup style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Kind"} hint={kind} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Ref"} hint={ref} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Key"} hint={value} />
                    </View>

                </ItemGroup>

                <ItemGroup style={{
                    marginBottom: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Encrypted keys migrated"} hint={keysStorageState.migrated ? 'migrated' : 'not migrated'} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Biometrics state"} hint={keysStorageState.biometricsState} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Passcode state"} hint={keysStorageState.passcodeState ?? 'Not set'} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton
                            leftIcon={require('../../../assets/ic_backup.png')}
                            title={"Check keys storage status again"}
                            onPress={() => {
                                const stored = loadStorageState(AppConfig.isTestnet);
                                setKeysStorageState(stored);
                            }}
                        />
                    </View>
                </ItemGroup>
            </View>
        </ScrollView>
    );
});