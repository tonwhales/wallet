import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import React, { useCallback, useEffect } from "react";
import { TonTransport } from "ton-ledger";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";
import { startWalletV4Sync } from "../../../engine/sync/startWalletV4Sync";
import { Address } from "ton";
import { warn } from "../../../utils/log";
import { useEngine } from "../../../engine/Engine";

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
    const engine = useEngine();
    const [ledgerConnection, setLedgerConnection] = React.useState<TypedTransport | null>(null);
    const [tonTransport, setTonTransport] = React.useState<TonTransport | null>(null);
    const [addr, setAddr] = React.useState<LedgerAddress | null>(null);

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
    }, [])

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
    return React.useContext(TransportContext)!;
}