import React, { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform, View, Text, ScrollView, Alert } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Observable, Subscription } from "rxjs";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { BleDeviceComponent, LedgerDevice } from "./BleDeviceComponent";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';

export const LedgerDeviceSelection = React.memo(({ onSelectDevice, onReset }: { onSelectDevice: (device: any) => Promise<void>, onReset: () => void }) => {
    const [scan, setScan] = useState<{ type: 'ongoing' } | { type: 'completed', success: boolean }>();
    const [devices, setDevices] = useState([]);

    const onDeviceSelect = useCallback(async (device: any) => {
        console.log('onDeviceSelect', { device });
        await onSelectDevice(device);
    }, []);

    useEffect(() => {
        (async () => {
            let sub: Subscription;
            const scan = async () => {
                console.log('Scanning...');
                setScan({ type: 'ongoing' });
                sub = new Observable(TransportBLE.listen).subscribe({
                    complete: () => {
                        setScan({ type: 'completed', success: true });
                    },
                    next: e => {
                        console.log(e);
                        if (e.type === "add") {
                            const device = e.descriptor;
                            setDevices((prev) => {
                                if (prev.some((i: any) => i.id === device.id)) {
                                    return prev;
                                }
                                return devices.concat(device);
                            });
                        }
                        // NB there is no "remove" case in BLE.
                    },
                    error: error => {
                        console.log(JSON.stringify(error));
                        setScan({ type: 'completed', success: false });
                    }
                });
            }
            if (Platform.OS === "android" && Platform.Version >= 23) {
                const checkCoarse = await checkMultiple([PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);

                if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted' || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                    const requestLocation = await requestMultiple([PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
                    console.log({ requestLocation });
                    if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted' || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                        return;
                    }
                }

                const scanConnect = await checkMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                ]);

                console.log({ scanConnect });
                if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted' || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                    console.log('here');
                    let resScanConnect = await requestMultiple([
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    ]);
                    console.log({ resScanConnect });
                    if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted' || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                        return;
                    }
                }
            }
            let previousAvailable = false;
            new Observable(TransportBLE.observeState).subscribe((e: any) => {
                console.log(e);
                if (e.type === 'PoweredOff') {
                    Alert.alert(t('hardwareWallet.errors.turnOnBluetooth'));
                    if (sub) sub.unsubscribe();
                    setDevices([]);
                    setScan(undefined);
                    onReset();
                }
                if (e.available !== previousAvailable) {
                    previousAvailable = e.available;
                    if (e.available) {
                        if (sub) sub.unsubscribe();
                        setDevices([]);
                        setScan(undefined);
                        scan()
                    }
                }
            });

            scan();
        })();
    }, []);

    return (
        <View>
            {!!scan && (scan.type === 'ongoing' || scan.type === 'completed') && (
                <View style={{ marginTop: 8, backgroundColor: Theme.background, flexDirection: 'row' }} collapsable={false}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginHorizontal: 16,
                        marginVertical: 8
                    }}>
                        {t('hardwareWallet.devices')}
                    </Text>
                    {scan.type === 'ongoing' && (
                        <LoadingIndicator simple />
                    )}
                </View>
            )}
            <ScrollView>
                {devices.map((device: any) => {
                    return (
                        <BleDeviceComponent key={`ledger-${device.id}`} device={device} onSelect={onDeviceSelect} />
                    );
                })}
            </ScrollView>
        </View>
    )
});