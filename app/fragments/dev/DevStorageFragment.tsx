import * as React from 'react';
import { View } from 'react-native';
import { Item } from '../../components/Item';
import { fragment } from '../../fragment';
import { getApplicationKey, getBiometricsState, getPasscodeState, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { ItemButton } from '../../components/ItemButton';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemGroup } from '../../components/ItemGroup';
import { useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';

function loadStorageState() {
    const biometricsState = getBiometricsState();
    const passcodeState = getPasscodeState();
    return {
        biometricsState,
        passcodeState,
    }
}

export const DevStorageFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    let [value, setValue] = React.useState('');

    const initialState = loadStorageState();
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
            <View style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, paddingHorizontal: 16 }}>
                <ItemGroup style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: theme.surfaceOnBg,
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
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Biometrics state"} hint={keysStorageState.biometricsState ?? 'Not set'} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Passcode state"} hint={keysStorageState.passcodeState ?? 'Not set'} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton
                            leftIcon={require('../../../assets/ic_backup.png')}
                            title={"Check keys storage status again"}
                            onPress={() => {
                                const stored = loadStorageState();
                                setKeysStorageState(stored);
                            }}
                        />
                    </View>
                </ItemGroup>
            </View>
        </ScrollView>
    );
});