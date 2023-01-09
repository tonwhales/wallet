import React, { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform, View, Text, ScrollView, Alert } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Observable, Subscription } from "rxjs";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { BleDevice, LedgerDevice } from "./components/BleDevice";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";

export const LedgerDeviceSelection = React.memo(({ onSelectDevice, onReset }: { onSelectDevice: (device: any) => Promise<void>, onReset: () => void }) => {
    const safeArea = useSafeAreaInsets();
    const [scan, setScan] = useState<{ type: 'ongoing' } | { type: 'completed', success: boolean }>();
    const [devices, setDevices] = useState([]);

    const onDeviceSelect = useCallback(async (device: any) => {
        await onSelectDevice(device);
    }, []);

    useEffect(() => {
        (async () => {
            let sub: Subscription;
            const scan = async () => {
                setScan({ type: 'ongoing' });
                sub = new Observable(TransportBLE.listen).subscribe({
                    complete: () => {
                        setScan({ type: 'completed', success: true });
                    },
                    next: e => {
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
                        setScan({ type: 'completed', success: false });
                    }
                });
            }
            if (Platform.OS === "android" && Platform.Version >= 23) {
                const checkCoarse = await checkMultiple([PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);

                if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted' || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                    const requestLocation = await requestMultiple([PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
                    if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted' || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                        return;
                    }
                }

                const scanConnect = await checkMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                ]);

                if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted' || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                    let resScanConnect = await requestMultiple([
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    ]);
                    if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted' || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                        return;
                    }
                }
            }
            let previousAvailable = false;
            new Observable(TransportBLE.observeState).subscribe((e: any) => {
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
        <View style={{ flexGrow: 1 }}>
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
            <ScrollView style={{
                flexGrow: 1
            }}>
                {devices.map((device: any) => {
                    return (
                        <BleDevice key={`ledger-${device.id}`} device={device} onSelect={onDeviceSelect} />
                    );
                })}
            </ScrollView>
            <View style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: safeArea.bottom + 16,
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
                    onPress={onReset}
                />
            </View>
        </View>
    )
});