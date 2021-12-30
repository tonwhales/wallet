import * as React from 'react';
import { Text, View } from 'react-native';
import { delay } from 'teslabot';
import { fromNano } from 'ton';
import { fetchBalance } from '../client';
import { fragment } from "../fragment";
import { getAppState } from '../utils/storage';
import { backoff } from '../utils/time';
import QRCode from 'react-native-qrcode-svg';
import { RoundButton } from '../components/RoundButton';
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const HomeFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [balance, setBalance] = React.useState<string | null>(null);
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

    return (
        <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
            <Text>Balance: {balance}💎</Text>
            <Text>Address: {address.toFriendly()}</Text>
            <QRCode
                size={260}
                value={'ton://transfer/' + address.toFriendly()}
                color="#802216"
            />
            <RoundButton title="View Backup" onPress={() => navigation.navigate('WalletBackup')} />
            <RoundButton title="Transfer" onPress={() => navigation.navigate('Transfer')} />
        </View>
    );
});