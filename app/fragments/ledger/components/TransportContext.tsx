import React, { ReactNode, createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { Alert, Platform } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";
import { TonTransport } from '@ton-community/ton-ledger';
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { TypedNavigation } from "../../../utils/useTypedNavigation";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport, device: any, navigation: TypedNavigation }
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
        focused: boolean,
        setFocused: (focused: boolean) => void,
    }
    | null
>(null);

export const LedgerTransportProvider = ({ children }: { children: ReactNode }) => {
    const [ledgerConnection, setLedgerConnection] = useState<TypedTransport | null>(null);
    const [tonTransport, setTonTransport] = useState<TonTransport | null>(null);
    const [addr, setAddr] = useState<LedgerAddress | null>(null);
    const [bleState, dispatchBleState] = useReducer(bleSearchStateReducer, null);
    const [bleSearch, setSearch] = useState<number>(0);
    const [focused, setFocused] = useState(false);

    const reset = useCallback(() => {
        setLedgerConnection(null);
        setTonTransport(null);
        setAddr(null);
        setSearch(0);
        setFocused(false);
        dispatchBleState({ type: 'reset' });
    }, []);

    const onSetLedgerConnecton = useCallback((connection: TypedTransport | null) => {
        setLedgerConnection(connection);
    }, []);

    const onDisconnect = useCallback((navigation: TypedNavigation) => {
        return () => {
            Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
                text: t('common.back'),
                onPress: () => {
                    navigation.navigateAndReplaceAll('Home');
                    reset();
                }
            }]);
        }
    }, []);

    const startHIDSearch = useCallback(async (navigation: TypedNavigation) => {
        let hid = await TransportHID.create();
        setLedgerConnection({ type: 'hid', transport: hid, device: null, navigation });
    }, []);

    const startBleSearch = useCallback(() => {
        setSearch(bleSearch + 1);
    }, [bleSearch]);

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

            ledgerConnection.transport.on('disconnect', onDisconnect(ledgerConnection.navigation));
            setTonTransport(new TonTransport(ledgerConnection.transport));

        } else if (ledgerConnection?.type === 'hid') {

            ledgerConnection.transport.on('disconnect', onDisconnect(ledgerConnection.navigation));
            ledgerConnection.transport.on('onDeviceDisconnect', onDisconnect(ledgerConnection.navigation));
            
            sub = new Observable(TransportHID.listen).subscribe((e: any) => {
                if (e.type === "remove") {
                    onDisconnect(ledgerConnection.navigation)();
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
                ledgerConnection, setLedgerConnection: onSetLedgerConnecton,
                addr, setAddr,
                startHIDSearch,
                startBleSearch,
                bleSearchState: bleState,
                focused, setFocused,
            }}
        >
            {children}
        </TransportContext.Provider>
    );
};

export function useLedgerTransport() {
    return useContext(TransportContext)!;
}