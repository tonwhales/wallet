import React, { useCallback, useEffect, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Observable, Subscription } from "rxjs";
import { t } from "../../../i18n/t";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { BleDevice } from "./BleDevice";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../../components/RoundButton";
import { useTheme } from '../../../engine/hooks/useTheme';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';

type StepScreen = { type: 'ongoing' } | { type: 'completed', success: boolean } | { type: 'permissions-failed' }

export const LedgerDeviceSelection = React.memo(({ onSelectDevice, onReset }: { onSelectDevice: (device: any) => Promise<void>, onReset: () => void }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const [scan, setScan] = useState<StepScreen>();
    const [devices, setDevices] = useState([]);
    const [search, setSearch] = useState(0);

    const onDeviceSelect = useCallback(async (device: any) => {
        await onSelectDevice(device);
    }, []);

    useEffect(() => {
        let powerSub: Subscription;
        let sub: Subscription;
        (async () => {
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
                const checkCoarse = await checkMultiple([
                    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                ]);

                if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                    || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                    const requestLocation = await requestMultiple([
                        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                    ]);
                    if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                        || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                        setScan({ type: 'permissions-failed' });
                        return;
                    }
                }

                const scanConnect = await checkMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                ]);

                if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                    || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                    let resScanConnect = await requestMultiple([
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    ]);
                    if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                        || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                        setScan({ type: 'permissions-failed' });
                        return;
                    }
                }
            }
            let previousAvailable = false;
            powerSub = new Observable(TransportBLE.observeState).subscribe((e: any) => {
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
        return () => {
            if (sub) sub.unsubscribe();
            if (powerSub) powerSub.unsubscribe();
        }
    }, [search]);

    if (scan?.type === 'permissions-failed') {
        return (
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    marginHorizontal: 16,
                    marginVertical: 16,
                    textAlign: 'center'
                }}>
                    {t('hardwareWallet.errors.permissions')}
                </Text>
                <RoundButton
                    title={t('hardwareWallet.actions.givePermissions')}
                    action={async () => {
                        const checkCoarse = await checkMultiple([
                            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                        ]);

                        if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                            || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                            const requestLocation = await requestMultiple([
                                PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                            ]);
                            if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                                || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }

                        const scanConnect = await checkMultiple([
                            PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                        ]);

                        if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                            || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                            let resScanConnect = await requestMultiple([
                                PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                                PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                            ]);
                            if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                                || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }
                    }}
                    style={{
                        marginBottom: safeArea.bottom + 16,
                        marginHorizontal: 16,
                    }}
                />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1 }}>
            {!scan && (
                <LoadingIndicator
                    style={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0,
                    }}
                    simple
                />
            )}
            {!!scan && scan.type === 'ongoing' && (
                <View style={{ marginTop: 8, backgroundColor: theme.background, flexDirection: 'row' }} collapsable={false}>
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
            {!!scan && scan.type === 'completed' && (
                <View style={{ marginTop: 8, backgroundColor: theme.background, flexDirection: 'row' }} collapsable={false}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginHorizontal: 16,
                        marginVertical: 8
                    }}>
                        {t('hardwareWallet.devices')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.scanBluetooth')}
                        onPress={() => setSearch(search + 1)}
                        style={{
                            marginBottom: safeArea.bottom + 16,
                            marginHorizontal: 16,
                        }}
                    />
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
                backgroundColor: theme.background,
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