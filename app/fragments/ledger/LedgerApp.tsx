import BN from "bn.js";
import React from "react";
import { View, Text } from "react-native";
import { delay } from "teslabot";
import { Address, fromNano, TonClient4 } from "ton";
import { TonTransport } from "ton-ledger";
import { AddressComponent } from "../../components/AddressComponent";
import { backoff } from "../../utils/time";
import { LedgerTransferComponent } from "./LedgerTransferComponent";

export const LedgerApp = React.memo((props: { transport: TonTransport, account: number, address: { address: string, publicKey: Buffer }, reset: () => void, tonClient4: TonClient4 }) => {
    const address = React.useMemo(() => Address.parse(props.address.address), [props.address.address]);

    const [balance, setBalance] = React.useState<BN | null>(null);
    React.useEffect(() => {
        let exited = false;
        backoff('ledger-app', async () => {
            while (true) {
                let seqno = (await props.tonClient4.getLastBlock()).last.seqno;
                let acc = await props.tonClient4.getAccountLite(seqno, Address.parse(props.address.address));
                setBalance(new BN(acc.account.balance.coins, 10));
                await delay(1000);
            }
        });

        return () => {
            exited = true;
        };
    }, []);

    return (
        <View>
            <AddressComponent address={address} />
            <Text>Balance: {balance === null ? '...' : fromNano(balance)}</Text>
            <LedgerTransferComponent
                transport={props.transport}
                account={props.account}
                addr={props.address}
                tonClient4={props.tonClient4} /
            >
        </View>
    );
});