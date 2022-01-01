import * as React from 'react';
import { Text, View } from 'react-native';
import { delay } from 'teslabot';
import { Cell, fromNano, parseTransaction, RawTransaction } from 'ton';
import { client, fetchBalance } from '../client';
import { fragment } from "../fragment";
import { getAppState } from '../utils/storage';
import { backoff } from '../utils/time';
import QRCode from 'react-native-qrcode-svg';
import { RoundButton } from '../components/RoundButton';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { ScrollView } from 'react-native-gesture-handler';
import { TransactionView } from '../components/TransactionView';

export const HomeFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [balance, setBalance] = React.useState<string | null>(null);
    const [transactions, setTransactions] = React.useState<RawTransaction[]>([]);
    React.useEffect(() => {
        (async () => {
            backoff(async () => {
                while (true) {
                    let value = await fetchBalance(address);
                    setBalance(fromNano(value));
                    await delay(5000);
                }
            })
        })();
    }, []);

    React.useEffect(() => {
        (async () => {
            backoff(async () => {
                while (true) {
                    let transactions = await client.getTransactions(address, { limit: 100 });
                    let res = transactions.map((v) => parseTransaction(address.workChain, Cell.fromBoc(Buffer.from(v.data, 'base64'))[0].beginParse()));
                    setTransactions(res);
                }
            })
        })();
    }, []);

    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <Text>Balance: {balance}💎</Text>
            <Text>Address: {address.toFriendly()}</Text>
            <QRCode
                size={260}
                value={'ton://transfer/' + address.toFriendly()}
                color="#802216"
            />
            <RoundButton title="View Backup" onPress={() => navigation.navigate('WalletBackup')} />
            <RoundButton title="Transfer" onPress={() => navigation.navigate('Transfer')} />
            {transactions.map((t, i) => (
                <TransactionView tx={t} key={'tx-' + i} />
            ))}
        </ScrollView>
    );
});