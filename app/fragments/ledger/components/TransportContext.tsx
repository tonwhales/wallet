import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
import Transport from "@ledgerhq/react-native-hid";
import React, { useCallback, useEffect } from "react";
import { TonTransport } from "ton-ledger";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";

export type TypedTransport = { type: 'hid', transport: Transport } | { type: 'ble', transport: BluetoothTransport };
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

    useEffect(() => {
        if (ledgerConnection?.type === 'ble') {
            ledgerConnection.transport.on('disconnect', () => {
                Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
                    text: t('common.back'),
                    onPress: () => {
                        navigation.popToTop();
                    }
                }]);
            });

            setTonTransport(new TonTransport(ledgerConnection.transport));

        } else if (ledgerConnection?.type === 'hid') {
            ledgerConnection.transport.on('disconnect', () => {
                Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
                    text: t('common.back'),
                    onPress: () => {
                        navigation.popToTop();
                    }
                }]);
            });
        }

        return () => {
            ledgerConnection?.transport.off('disconnect', () => { });
            ledgerConnection?.transport.close();
            reset();
        }
    }, [ledgerConnection]);

    return (
        <TransportContext.Provider value={{ ledgerConnection, setLedgerConnection, tonTransport, addr, setAddr }}>
            {children}
        </TransportContext.Provider>
    );
};

export function useTransport() {
    return React.useContext(TransportContext)!;
}