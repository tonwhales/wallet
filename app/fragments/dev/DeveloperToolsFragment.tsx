import * as React from 'react';
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { Page } from '../../components/Page';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const DeveloperToolsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();
    // let [value, setValue] = React.useState('');
    // React.useEffect(() => {
    //     (async () => {
    //         try {
    //             let key = await getApplicationKey();
    //             setValue(key.toString('base64'));
    //         } catch (e) {
    //             console.warn(e);
    //             setValue('error');
    //         }
    //     })();
    // }, []);
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        reboot();
    }, []);

    const testBluetooth = React.useCallback(() => {
        navigation.navigate('DevBluetooth');
        // (async () => {
        //     let state = await manager.state();
        //     console.warn(state);
        //     manager.startDeviceScan(null, null, (error, device) => {
        //         if (device && device.name && device.name.startsWith('CoolWallet')) {
        //             console.warn(device);
        //         }
        //     });
        // })()
        // manager.startDeviceScan(null, null, (error, device) => {
        //     console.warn(error);
        //     console.warn(device);
        // });
    }, []);
    // const isTestNet = useTestnet();
    // const switchNetwork = React.useCallback(() => {
    //     let state = (getAppState())!;
    //     setAppState({ ...state, testnet: !state.testnet });
    //     reboot();
    // }, []);
    return (
        <Page style={{ paddingHorizontal: 16 }}>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
                overflow: 'hidden'
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton title={"Test BLE"} onPress={testBluetooth} />
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
                {/* <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Key"} hint={value} />
                </View> */}
            </View>
        </Page>
    );
});