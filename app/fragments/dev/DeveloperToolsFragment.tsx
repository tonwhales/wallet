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
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, StateInit } from 'ton';
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

                        const transferCell = createDeploySubCell(
                            account.seqno,
                            contract.source.walletId,
                            Math.floor(Date.now() / 1e3) + 60,
                            acc.address
                        );

                        let walletKeys: WalletKeys;
                        try {
                            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
                        } catch (e) {
                            warn(e);
                            return;
                        }

                        const tempTransferRaw = transferCell;
                        const tempTransfer = tempTransferRaw.beginParse();
                        const transferWalletId = tempTransfer.readUintNumber(32);

                        console.log({
                            contract_walletId: contract.source.walletId,
                            transfer_walletId: transferWalletId
                        });

                        const transfer = new Cell();

                        // Signature
                        transfer.bits.writeBuffer(sign(await transferCell.hash(), walletKeys.keyPair.secretKey));
                        // Transfer
                        transfer.writeCell(transferCell);

                        let extMessage = new ExternalMessage({
                            to: contract.address,
                            body: new CommonMessageInfo({
                                stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                                body: new CellMessage(transfer)
                            })
                        });
                        let msg = new Cell();
                        extMessage.writeTo(msg);

                        // await backoff('deploy-and-install-subscription', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));
                    }} />
                </View>
            </View>
        </View>
    );
});