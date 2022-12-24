import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { LedgerDeviceSelection } from "../LedgerDeviceSelection";
import { LedgerDevice } from "./BleDevice";
import { TonTransport } from "ton-ledger";
import { LedgerSelectAccount } from "./LedgerSelectAccount";

export const LedgerBle = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const [screen, setScreen] = useState<'scan' | 'select-account' | null>(null);

    const [account, setAccount] = React.useState<number | null>(null);
    const [bluetoothDevice, setBluetoothDevice] = useState<LedgerDevice | null>(null);
    const [device, setDevice] = React.useState<TonTransport | null>(null);

    let reset = React.useCallback(() => {
        setDevice(null);
        setAccount(null);
        setScreen(null)
    }, []);

    const onSelectDevice = useCallback(async (device: LedgerDevice) => {
        const transport = await TransportBLE.open(device.id);
        transport.on('disconnect', () => {
            // Intentionally for the sake of simplicity we use a transport local state
            // and remove it on disconnect.
            // A better way is to pass in the device.id and handle the connection internally.
            setDevice(null);
            setBluetoothDevice(null);
        });
        const tonTransport = new TonTransport(transport);
        setBluetoothDevice(device);
        setDevice(tonTransport);
        setScreen('select-account');
    }, []);

    const onScan = useCallback(async () => {
        // const state = await bleManager.state();
        // if (state !== 'PoweredOn') {
        //     Alert.alert(t('hardwareWallet.errors.turnOnBluetooth'));
        //     return;
        // }
        setScreen('scan');
    }, []);

    useEffect(() => {
        return () => {
            if (bluetoothDevice) {
                TransportBLE.disconnect(bluetoothDevice.id);
            }
        }
    }, [bluetoothDevice]);

    console.log({ screen, device: !!device, account: account !== null });

    return (
        <View style={{ flexGrow: 1 }}>
            {(screen !== 'scan' && !device) && (
                <>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        flexGrow: 1,
                    }}>
                        <View style={{ flexGrow: 1 }} />
                        <Image style={{ width: 256, height: 256 }}
                            source={require('../../../../assets/ic_ledger_x.png')}
                        />
                        <Text style={{
                            color: Theme.textColor,
                            fontWeight: '600',
                            fontSize: 18,
                            marginBottom: 12,
                            marginHorizontal: 16,
                        }}>
                            {t('hardwareWallet.actions.connect')}
                        </Text>
                        <Text style={{
                            color: Theme.textColor,
                            fontWeight: '400',
                            fontSize: 16,
                            marginBottom: 12,
                        }}>
                            {t('hardwareWallet.bluetoothScanDescription')}
                        </Text>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                    <RoundButton
                        title={t('hardwareWallet.actions.scanBluetooth')}
                        onPress={onScan}
                        style={{
                            position: 'absolute',
                            bottom: safeArea.bottom + 16, left: 16, right: 16,
                        }}
                    />
                </>
            )}
            {screen === 'scan' && (
                <LedgerDeviceSelection onReset={reset} onSelectDevice={onSelectDevice} />
            )}

            {(!!device && screen === 'select-account') && (
                <LedgerSelectAccount reset={reset} device={device} />
            )}

            {(!!device || account) && !(device && account !== null) && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: safeArea.bottom + 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
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
        </View>
    );
});