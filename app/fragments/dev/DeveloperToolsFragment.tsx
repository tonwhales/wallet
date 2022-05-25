import * as React from 'react';
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { getApplicationKey, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { getCurrentAddress } from '../../storage/appState';
import BN from 'bn.js';
import { Theme } from '../../Theme';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const DeveloperToolsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();
    let [value, setValue] = React.useState('');
    React.useEffect(() => {
        (async () => {
            try {
                let key = await getApplicationKey();
                setValue(key.toString('base64'));
            } catch (e) {
                console.warn(e);
                setValue('error');
            }
        })();
    }, []);
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        reboot();
    }, []);
    // const isTestNet = useTestnet();
    // const switchNetwork = React.useCallback(() => {
    //     let state = (getAppState())!;
    //     setAppState({ ...state, testnet: !state.testnet });
    //     reboot();
    // }, []);
    return (
        <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 64 }}>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Version"} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Kind"} hint={kind} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Ref"} hint={ref} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Key"} hint={value} />
                </View>
                {AppConfig.isTestnet && (
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Deploy and install plugin"} onPress={() => {
                            const acc = getCurrentAddress();
                            navigation.navigate('PluginTransfer', {
                                address: acc.address,
                                operation: 'deploy_install',
                                amount: new BN(100000000)
                            });
                        }} />
                    </View>
                )}
            </View>
        </View>
    );
});