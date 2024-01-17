import React, { ReactNode, createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Alert, Platform } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";
import { TonTransport } from '@ton-community/ton-ledger';
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { navigationRef } from '../../../Navigation';
import { delay } from "teslabot";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport, device: any }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };

export type BLESearchState =
    | { type: 'ongoing', devices: any[] }
    | { type: 'completed', success: true, devices: any[] }
    | { type: 'completed', success: false, }
    | { type: 'permissions-failed' }
    | null;

type BleSearchAction =
    | { type: 'add', device: any }
    | { type: 'error' }
    | { type: 'complete' }
    | { type: 'start' }
    | { type: 'permissions-failed' }
    | { type: 'reset' }

const bleSearchStateReducer = (state: BLESearchState, action: BleSearchAction): BLESearchState => {
    switch (action.type) {
        case 'start':
            return {
                type: 'ongoing',
                devices: [],
            };
        case 'add':
            if (state?.type === 'ongoing') {
                if (state.devices.find(d => d.id === action.device.id)) {
                    return state;
                }
            }
            return {
                type: 'ongoing',
                devices: state?.type === 'ongoing' ? state.devices.concat(action.device) : [action.device],
            };
        case 'complete':
            return {
                type: 'completed',
                success: true,
                devices: state?.type === 'ongoing' ? state.devices : [],
            };
        case 'error':
            return {
                type: 'completed',
                success: false,
            }
        case 'permissions-failed':
            return {
                type: 'permissions-failed',
            }
        case 'reset':
            return null;
    }
}

export const TransportContext = createContext<
    {
        ledgerConnection: TypedTransport | null,
        setLedgerConnection: (transport: TypedTransport | null) => void,
        tonTransport: TonTransport | null,
        addr: LedgerAddress | null,
        setAddr: (addr: LedgerAddress | null) => void,
        bleSearchState: BLESearchState,
        startHIDSearch: (navigation: TypedNavigation) => Promise<void>,
        startBleSearch: () => void,
        reset: () => void,
    }
    | null
>(null);

export const LedgerTransportProvider = ({ children }: { children: ReactNode }) => {
    // Trasport state
    const [ledgerConnection, setLedgerConnection] = useState<TypedTransport | null>(null);

    // TON wrapper
    const [tonTransport, setTonTransport] = useState<TonTransport | null>(null);

    // Selected address
    const [addr, setAddr] = useState<LedgerAddress | null>(null);

    // BLE search state
    const [bleState, dispatchBleState] = useReducer(bleSearchStateReducer, null);
    const [bleSearch, setSearch] = useState<number>(0);

    const reconnectAttempts = useRef<number>(0);

    const reset = useCallback(() => {
        setLedgerConnection(null);
        setTonTransport(null);
        setAddr(null);
        setSearch(0);
        dispatchBleState({ type: 'reset' });
        reconnectAttempts.current = 0;
    }, []);

    const startHIDSearch = useCallback(async () => {
        let hid: Transport | undefined;
        try { // For some reason, the first time this is called, it fails and only requests permission to connect the HID device
            await TransportHID.create();
        } catch {
            // Retry to account for first failed create with connect permission request
            hid = await TransportHID.create();
        }
        if (hid) {
            setLedgerConnection({ type: 'hid', transport: hid, device: null });
        }
    }, []);

    const onDisconnect = useCallback(() => {
        const maxReconnectAttempts = ledgerConnection?.type === 'hid' ? 1 : 2;

        // Try to reconnect if we haven't reached the max attempts,
        // on device unlocked or ton app opened events
        if (
            reconnectAttempts.current < maxReconnectAttempts
        ) {
            reconnectAttempts.current++;
            (async () => {
                try {
                    if (!ledgerConnection) return;
                    console.warn('[ledger] reconnect #' + reconnectAttempts.current);

                    let timeoutAwaiter = new Promise<TransportBLE>((_, reject) => setTimeout(() => reject(new Error('Timeout of 10000 ms occured')), 10000));
                    if (ledgerConnection.type === 'hid') {
                        await Promise.race([startHIDSearch(), timeoutAwaiter]);
                    } else {
                        const transport = await Promise.race([TransportBLE.open(ledgerConnection.device.id), timeoutAwaiter]);
                        setLedgerConnection({ type: 'ble', transport, device: ledgerConnection.device });
                    }
                    reconnectAttempts.current = 0;
                } catch {
                    console.warn('[ledger] reconnect failed');
                    await delay(1000);
                    onDisconnect();
                }
            })();
            return;
        }

        Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
            text: t('common.back'),
            onPress: () => {
                navigationRef.reset({ index: 0, routes: [{ name: 'Home' }] });
                reset();
            }
        }]);
    }, [ledgerConnection]);

    const startBleSearch = useCallback(() => {
        setSearch((prevSearch) => prevSearch + 1);
    }, []);

    useEffect(() => {
        let powerSub: Subscription;
        let sub: Subscription;
        const scan = async () => {
            dispatchBleState({ type: 'start' });
            sub = new Observable(TransportBLE.listen).subscribe({
                complete: () => {
                    dispatchBleState({ type: 'complete' });
                },
                next: e => {
                    if (e.type === "add") {
                        const device = e.descriptor;
                        dispatchBleState({ type: 'add', device });
                    }
                    // NB there is no "remove" case in BLE.
                },
                error: error => {
                    dispatchBleState({ type: 'error' });
                }
            });
        }

        (async () => {
            if (!bleSearch) return;
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
                        dispatchBleState({ type: 'permissions-failed' });
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
                        dispatchBleState({ type: 'permissions-failed' });
                        return;
                    }
                }
            }

            let previousAvailable = false;
            powerSub = new Observable(TransportBLE.observeState).subscribe((e: any) => {
                if (e.type === 'PoweredOff') {
                    Alert.alert(t('hardwareWallet.errors.turnOnBluetooth'));
                    if (sub) sub.unsubscribe();
                    dispatchBleState({ type: 'error' });
                    reset();
                }
                if (e.available !== previousAvailable) {
                    previousAvailable = e.available;
                    if (e.available) {
                        if (sub) sub.unsubscribe();
                        dispatchBleState({ type: 'error' });
                        scan();
                    }
                }
            });
        })();

        return () => {
            if (sub) sub.unsubscribe();
            if (powerSub) powerSub.unsubscribe();
        }
    }, [bleSearch]);

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
        <TransportContext.Provider
            value={{
                tonTransport,
                ledgerConnection,
                setLedgerConnection,
                addr,
                setAddr,
                startHIDSearch,
                startBleSearch,
                bleSearchState: bleState,
                reset,
            }}
        >
            {children}
        </TransportContext.Provider>
    );
};

export function useLedgerTransport() {
    return useContext(TransportContext)!;
}