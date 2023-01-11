import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import React, { useCallback, useEffect } from "react";
import { TonTransport } from "ton-ledger";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };

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

export const TransportProvider = ({ children }: { children: React.ReactNode }) => {
    const navigation = useTypedNavigation();
    const [ledgerConnection, setLedgerConnection] = React.useState<TypedTransport | null>(null);
    const [tonTransport, setTonTransport] = React.useState<TonTransport | null>(null);
    const [addr, setAddr] = React.useState<LedgerAddress | null>(null);

    const reset = useCallback(() => {
        setLedgerConnection(null);
        setTonTransport(null);
        setAddr(null);
    }, []);

    const onSetLedgerConnecton = useCallback((connection: TypedTransport | null) => {
        if (!connection) {
            ledgerConnection?.transport.off('disconnect', () => { });
            ledgerConnection?.transport.close();
        }
        setLedgerConnection(connection);
    }, []);

    const disconnectAlert = useCallback(() => {
        Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
            text: t('common.back'),
            onPress: () => {
                navigation.popToTop();
            }
        }]);
    }, []);

    useEffect(() => {
        let sub: Subscription | null = null;
        if (ledgerConnection?.type === 'ble') {
            ledgerConnection.transport.on('disconnect', () => {
                disconnectAlert();
            });

            setTonTransport(new TonTransport(ledgerConnection.transport));

        } else if (ledgerConnection?.type === 'hid') {
            ledgerConnection.transport.on('disconnect', () => {
                disconnectAlert();
            });

            sub = new Observable(TransportHID.listen).subscribe((e: any) => {
                if (e.type === "remove") {
                    disconnectAlert();
                }
            });

            ledgerConnection.transport.on('onDeviceDisconnect', () => {
                disconnectAlert();
            });

            setTonTransport(new TonTransport(ledgerConnection.transport));

            return () => {
                sub?.unsubscribe();
            }
        }
    }, [ledgerConnection]);

    useEffect(() => {
        return () => {
            if (ledgerConnection) {
                ledgerConnection.transport.off('disconnect', () => { });
                ledgerConnection.transport.off('onDeviceDisconnect', () => { });
                ledgerConnection.transport.close();
                reset();
            }
        }
    }, []);


    return (
        <TransportContext.Provider value={{ ledgerConnection, setLedgerConnection: onSetLedgerConnecton, tonTransport, addr, setAddr }}>
            {children}
        </TransportContext.Provider>
    );
};

export function useTransport() {
    return React.useContext(TransportContext)!;
}