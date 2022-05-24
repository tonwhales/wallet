import * as React from 'react';
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { getCurrentAddress } from '../../storage/appState';
import { useEngine } from '../../engine/Engine';
import { useItem } from '../../engine/persistence/PersistedItem';
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, StateInit } from 'ton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { createDeployPluginCell } from '../../utils/createDeployPluginCell';
import { warn } from '../../utils/log';
import { sign } from 'ton-crypto';
import { backoff } from '../../utils/time';
import { Page } from '../../components/Page';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import BN from 'bn.js';
import { createInstallPluginCell } from '../../utils/createInstallPluinCell';
import { createRemovePluginCell } from '../../utils/createRemovePluginCell';

export const DeveloperToolsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const reboot = useReboot();
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
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
        </Page>
    );
});