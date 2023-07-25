import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import React, { useCallback, useEffect, useState } from "react";
import { TonTransport } from "ton-ledger";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert, Platform } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";
import { startWalletV4Sync } from "../../../engine/sync/startWalletV4Sync";
import { Address } from "ton";
import { warn } from "../../../utils/log";
import { useEngine } from "../../../engine/Engine";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };
export type BLESearchState = { type: 'ongoing' } | { type: 'completed', success: boolean } | { type: 'permissions-failed' }

export const TransportContext = React.createContext<
    {
        ledgerConnection: TypedTransport | null,
        setLedgerConnection: (transport: TypedTransport | null) => void,
        tonTransport: TonTransport | null,
        addr: LedgerAddress | null,
        setAddr: (addr: LedgerAddress | null) => void
    }
    | null
>(null);

export const LedgerTransportProvider = ({ children }: { children: React.ReactNode }) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const [ledgerConnection, setLedgerConnection] = useState<TypedTransport | null>(null);
    const [tonTransport, setTonTransport] = useState<TonTransport | null>(null);
    const [addr, setAddr] = useState<LedgerAddress | null>(null);
    const [scan, setScan] = useState<BLESearchState | null>(null);
    const [devices, setDevices] = useState([]);
    const [search, setSearch] = useState(0);

    const reset = useCallback(() => {
        setLedgerConnection(null);
        setTonTransport(null);
        setAddr(null);
    }, []);

    const onSetLedgerConnecton = useCallback((connection: TypedTransport | null) => {
        setLedgerConnection(connection);
    }, []);

    const onDisconnect = useCallback(() => {
        Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
            text: t('common.back'),
            onPress: () => {
                navigation.popToTop();
            }
        }]);
    }, []);

    const onSetAddress = useCallback((selected: LedgerAddress | null) => {
        setAddr(selected);
        try {
            const parsed = Address.parse(selected!.address);
            startWalletV4Sync(parsed, engine);
            engine.products.ledger.startSync(parsed);
        } catch (e) {
            warn('Failed to parse address');
        }
    }, []);

    const startBLESearch = useCallback(async () => {
        let powerSub: Subscription;
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
                setScan(null);
                reset();
            }
            if (e.available !== previousAvailable) {
                previousAvailable = e.available;
                if (e.available) {
                    if (sub) sub.unsubscribe();
                    setDevices([]);
                    setScan(null);
                    scan();
                }
            }
        });

        return () => {
            if (sub) sub.unsubscribe();
            if (powerSub) powerSub.unsubscribe();
        }
    }, []);

    useEffect(() => {
        let sub: Subscription | null = null;
        if (ledgerConnection?.type === 'ble') {
            ledgerConnection.transport.on('disconnect', onDisconnect);

            setTonTransport(new TonTransport(ledgerConnection.transport));

        } else if (ledgerConnection?.type === 'hid') {
            ledgerConnection.transport.on('disconnect', onDisconnect);
            ledgerConnection.transport.on('onDeviceDisconnect', onDisconnect);

            sub = new Observable(TransportHID.listen).subscribe((e: any) => {
                if (e.type === "remove") {
                    onDisconnect();
                }
            });

            setTonTransport(new TonTransport(ledgerConnection.transport));

        }
        return () => {
            sub?.unsubscribe();
            ledgerConnection?.transport.off('disconnect', onDisconnect);
            ledgerConnection?.transport.off('onDeviceDisconnect', onDisconnect);
            ledgerConnection?.transport.close();
        }
    }, [ledgerConnection]);

    return (
        <TransportContext.Provider value={{ ledgerConnection, setLedgerConnection: onSetLedgerConnecton, tonTransport, addr, setAddr: onSetAddress }}>
            {children}
        </TransportContext.Provider>
    );
};

export function useTransport() {
    return React.useContext(TransportContext);
}