import React, { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform, View, Text, ScrollView } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Observable, Subscription } from "rxjs";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { BleDeviceComponent, LedgerDevice } from "./BleDeviceComponent";

export const LedgerDeviceSelection = React.memo(({ onSelectDevice }: { onSelectDevice: (device: any) => Promise<void> }) => {
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
                        setScan({ type: 'completed', success: false });
                    }
                });
            }
            if (Platform.OS === "android") {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
                );
            }
            let previousAvailable = false;
            new Observable(TransportBLE.observeState).subscribe((e: any) => {
                console.log(e);
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
                    <LoadingIndicator simple />
                </View>
            )}
            <ScrollView>
                {devices.map((device: any) => {
                    return (
                        <BleDeviceComponent device={device} onSelect={onDeviceSelect} />
                    );
                })}
            </ScrollView>
        </View>
    )
});