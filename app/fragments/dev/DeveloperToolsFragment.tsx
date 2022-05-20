import * as React from 'react';
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { getApplicationKey, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { getCurrentAddress } from '../../storage/appState';
import { useEngine } from '../../engine/Engine';
import { createRemovePluginCell } from '../../utils/createRemovePluginCell';
import { useItem } from '../../engine/persistence/PersistedItem';
import { Address, Cell } from 'ton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { createDeploySubCell } from '../../utils/createDeploySubCell';
import { warn } from '../../utils/log';
import { sign } from 'ton-crypto';
import { backoff } from '../../utils/time';

export const DeveloperToolsFragment = fragment(() => {
    const reboot = useReboot();
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();
    let [value, setValue] = React.useState('');
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
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
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Deploy and install sub plugin"} onPress={async () => {
                        const contract = await contractFromPublicKey(acc.publicKey);
                        const transferCell = createDeploySubCell(acc.address);

                        let walletKeys: WalletKeys;
                        try {
                            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
                        } catch (e) {
                            warn(e);
                            return;
                        }

                        const transfer = new Cell();

                        transfer.bits.writeBuffer(sign(await transferCell.hash(), walletKeys.keyPair.secretKey));
                        transfer.writeCell(transferCell);

                        await backoff('remove-plugin', () => engine.connector.sendExternalMessage(contract, transfer));
                    }} />
                </View>
            </View>
        </View>
    );
});