import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Platform, PermissionsAndroid } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Observable } from "rxjs";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { LedgerDeviceSelection } from "./LedgerDeviceSelection";
import { LedgerDevice } from "./BleDeviceComponent";
import { TonTransport } from "ton-ledger";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { AppConfig } from "../../AppConfig";
import { LedgerApp } from "./LedgerApp";
import { useEngine } from "../../engine/Engine";

export const LedgerBluetoothComponent = React.memo(({ onReset }: { onReset?: () => void }) => {
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const [screen, setScreen] = useState<'scan' | 'app' | null>(null);

    const [account, setAccount] = React.useState<number | null>(null);
    const [address, setAddress] = React.useState<{ address: string, publicKey: Buffer } | null>(null);
    const [bluetoothDevice, setBluetoothDevice] = useState<LedgerDevice | null>(null);
    const [device, setDevice] = React.useState<TonTransport | null>(null);

    let reset = React.useCallback(() => {
        setDevice(null);
        setAccount(null);
        setAddress(null);
        setScreen(null)
    }, []);

    const onLoadAccount = React.useCallback(
        (async () => {
            if (!device) {
                return;
            }
            if (account === null) {
                return;
            }
            let path = pathFromAccountNumber(account);
            console.log({ device, account, path });
            try {
                let address = await device.getAddress(path, { testOnly: AppConfig.isTestnet });
                console.log({ address });
                await device.validateAddress(path, { testOnly: AppConfig.isTestnet });
                setAddress(address);
            } catch (e) {
                console.warn(e);
                reset();
            }
        }),
        [device, account],
    );

    const onSelectDevice = useCallback(async (device: LedgerDevice) => {
        console.log('onSelectDevice', { device });
        const transport = await TransportBLE.open(device.id);
        transport.on('disconnect', () => {
            // Intentionally for the sake of simplicity we use a transport local state
            // and remove it on disconnect.
            // A better way is to pass in the device.id and handle the connection internally.
            console.log('onDisconeect');
            setDevice(null);
            setBluetoothDevice(null);
        });
        const tonTransport = new TonTransport(transport);
        console.log({ tonTransport });
        setBluetoothDevice(device);
        setDevice(tonTransport);
        setScreen('app');
    }, []);

    useEffect(() => {
        return () => {
            if (bluetoothDevice) {
                TransportBLE.disconnect(bluetoothDevice.id);
            }
        }
    }, [bluetoothDevice]);

    return (
        <View style={{ flexGrow: 1 }}>
            {(screen !== 'scan' && !device) && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '600',
                        fontSize: 18,
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        {t('hardwareWallet.bluetoothScanDescription')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.scanBluetooth')}
                        onPress={() => setScreen('scan')}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                </View>
            )}

            {screen === 'scan' && (
                <LedgerDeviceSelection onSelectDevice={onSelectDevice} />
            )}

            {!!device && account === null && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 18,
                        color: Theme.textColor,
                        marginBottom: 16,
                        textAlign: 'center'
                    }}>
                        {t('hardwareWallet.chooseAccountDescription')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 0 })}
                        onPress={() => setAccount(0)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 1 })}
                        onPress={() => setAccount(1)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 2 })}
                        onPress={() => setAccount(2)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 3 })}
                        onPress={() => setAccount(3)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 4 })}
                        onPress={() => setAccount(4)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 5 })}
                        onPress={() => setAccount(5)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 6 })}
                        onPress={() => setAccount(6)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                </View>
            )}

            {!!device && account !== null && address === null && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 18,
                        color: Theme.textColor,
                        marginBottom: 16
                    }}>
                        {t('hardwareWallet.openAppVerifyAddress')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.loadAddress')}
                        action={onLoadAccount}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                </View>
            )}

            {device && account !== null && address !== null && (
                <LedgerApp
                    transport={device}
                    account={account}
                    address={address}
                    tonClient4={engine.client4}
                />
            )}

            {(device || account || address) && !(device && account !== null && address !== null) && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Theme.background,
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display="secondary"
                        size="normal"
                        style={{ paddingHorizontal: 8 }}
                        onPress={reset}
                    />
                </View>
            )}

            {!!onReset && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: safeArea.bottom,
                    backgroundColor: Theme.background,
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display="secondary"
                        size="normal"
                        style={{ paddingHorizontal: 8 }}
                        onPress={onReset}
                    />
                </View>
            )}
        </View>
    );
});