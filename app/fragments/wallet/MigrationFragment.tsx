import { BN } from 'bn.js';
import * as React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { delay } from 'teslabot';
import { SendMode, WalletContractType } from 'ton';
import { client } from '../../client';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { loadWalletKeys, WalletKeys } from '../../utils/walletKeys';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { useTranslation } from 'react-i18next';
import { AndroidToolbar } from '../../components/AndroidToolbar';

const MigrationProcessFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const [status, setStatus] = React.useState<string>(t('Migrating old wallets...'));

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
            let targetContract = await contractFromPublicKey(key.keyPair.publicKey);

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
                setStatus(t('Checking ') + wallet.address.toFriendly() + '...');

                const state = await backoff(() => client.getContractState(wallet.address));
                if (state.balance.gt(new BN(0))) {
                    setStatus(t('Tranfer funds from ') + wallet.address.toFriendly() + '...');
                    await wallet.prepare(0, key.keyPair.publicKey, type);

                    // Seqno
                    const seqno = await backoff(() => wallet.getSeqNo());

                    // Transfer
                    await backoff(() => wallet.transfer({
                        seqno,
                        to: targetContract.address,
                        value: new BN(0),
                        sendMode: SendMode.CARRRY_ALL_REMAINING_BALANCE,
                        secretKey: key.keyPair.secretKey,
                        bounce: false
                    }));

                    while (!ended) {
                        let s = await backoff(() => wallet.getSeqNo());
                        if (s > seqno) {
                            break;
                        }
                    }
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
    const { t } = useTranslation();

    if (!confirm) {
        return (
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom, paddingTop: safeArea.top }}>
                <AndroidToolbar />
                <View style={{ flexGrow: 1 }} />
                <View style={{ marginHorizontal: 16 }}>
                    <RoundButton title={t("Proceed")} onPress={() => setConfirm(true)} />
                </View>
            </View>
        );
    }

    return (<MigrationProcessFragment />);
});