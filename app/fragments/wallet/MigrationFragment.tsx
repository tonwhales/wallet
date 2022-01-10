import { BN } from 'bn.js';
import * as React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { delay } from 'teslabot';
import { WalletContractType } from 'ton';
import { client } from '../../client';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { loadWalletKeys, WalletKeys } from '../../utils/walletKeys';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

const MigrationProcessFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const [status, setStatus] = React.useState('Migrating old wallets...');

    React.useEffect(() => {
        let ended = false;

        backoff(async () => {

            // Read key
            let key: WalletKeys
            try {
                key = await loadWalletKeys();
            } catch (e) {
                navigation.goBack();
                return;
            }

            // Check possible addresses
            const legacyTypes: WalletContractType[] = [
                'org.ton.wallets.simple.r2',
                'org.ton.wallets.simple.r3',
                'org.ton.wallets.v2',
                'org.ton.wallets.v2.r2',
                'org.ton.wallets.v3',
                'org.ton.wallets.v3.r2'
            ];
            for (let type of legacyTypes) {
                if (ended) {
                    return;
                }
                let wallet = await client.openWalletFromSecretKey({ workchain: 0, secretKey: key.keyPair.secretKey, type });
                if (ended) {
                    return;
                }
                setStatus('Checking ' + wallet.address.toFriendly() + '...');

                const state = await backoff(() => client.getContractState(wallet.address));
                if (state.balance.gt(new BN(0))) {
                    setStatus('Tranfer funds from ' + wallet.address.toFriendly() + '...');
                    await delay(10000);
                }
            }

            navigation.goBack();
        });

        return () => {
            ended = true;
        }
    }, []);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>{status}</Text>
        </View>
    );
});

export const MigrationFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const [confirm, setConfirm] = React.useState(false);

    if (!confirm) {
        return (
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                <View style={{ flexGrow: 1 }} />
                <View style={{ marginHorizontal: 16 }}>
                    <RoundButton title="Proceed" onPress={() => setConfirm(true)} />
                </View>
            </View>
        );
    }

    return (<MigrationProcessFragment />);
});