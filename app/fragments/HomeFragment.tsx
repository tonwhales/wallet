import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Cell, fromNano, parseTransaction, RawTransaction } from 'ton';
import { client } from '../client';
import { fragment } from "../fragment";
import { getAppState } from '../utils/storage';
import { backoff } from '../utils/time';
import { RoundButton } from '../components/RoundButton';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { ScrollView } from 'react-native-gesture-handler';
import { TransactionView } from '../components/TransactionView';
import { useAccountSync } from '../sync/useAccountSync';
import { Theme } from '../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [balance, loading] = useAccountSync(address);
    const [transactions, setTransactions] = React.useState<RawTransaction[]>([]);
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
    if (!balance) {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.loader} />
            </View>
        )
    }

    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ alignSelf: 'stretch', backgroundColor: Theme.accentLight, paddingTop: safeArea.top + 1000, marginTop: -1000, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
                <Text style={{ marginTop: 12, marginBottom: 24, color: 'white', opacity: 0.8 }}>
                    {loading ? 'Updating...' : 'Up to date'}
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '700', color: 'white' }}>
                    💎 {fromNano(balance)}
                </Text>
                <Text style={{ color: 'white' }}>Your balance</Text>
                <View style={{ flexDirection: 'row', marginTop: 32 }}>
                    <RoundButton title="Send" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 16 }} onPress={() => navigation.navigate('Transfer')} />
                    <RoundButton title="Receive" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 16 }} onPress={() => navigation.navigate('WalletReceive')} />
                </View>
            </View>

            {/* <Text>Address: {address.toFriendly()}</Text>
            <QRCode
                size={260}
                value={'ton://transfer/' + address.toFriendly()}
                color="#802216"
            /> */}
            {/* <RoundButton title="View Backup" onPress={() => navigation.navigate('WalletBackup')} /> */}
            {transactions.map((t, i) => (
                <TransactionView tx={t} key={'tx-' + i} />
            ))}
        </ScrollView>
    );
});