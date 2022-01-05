import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Text, View } from "react-native";
import { TextInput } from 'react-native-gesture-handler';
import { Address, fromNano, toNano } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { client } from '../../client';
import { ATextInput } from '../../components/ATextInput';
import { ModalHeader } from '../../components/ModalHeader';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { resolveUrl } from '../../utils/resolveUrl';
import { decryptData } from '../../utils/secureStorage';
import { getAppState, storage } from '../../utils/storage';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const TransferFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const [target, setTarget] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const doSend = React.useCallback(async () => {
        const state = getAppState()!;
        let address: Address;
        let value: BN;
        try {
            address = Address.parseFriendly(target).address;
            value = toNano(amount);
        } catch (e) {
            return;
        }

        // Read key
        let plainText: Buffer;
        try {
            const cypherData = Buffer.from(storage.getString('ton-mnemonics')!, 'base64');
            plainText = await decryptData(cypherData);
        } catch (e) {
            navigation.goBack();
            return;
        }
        let walletKey = await mnemonicToWalletKey(plainText.toString().split(' '));


        // Transfer
        let wallet = await client.openWalletFromAddress({ source: state.address });
        await wallet.prepare(0, walletKey.publicKey);
        let seqno = await wallet.getSeqNo();
        await backoff(async () => {
            await wallet.transfer({
                seqno,
                to: address,
                value,
                secretKey: walletKey.secretKey,
                bounce: false
            });
        });

        navigation.goBack();
    }, [amount, target]);
    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src);
        if (res) {
            setTarget(res.address.toFriendly());
            if (res.amount) {
                setAmount(fromNano(res.amount));
            }
        }
    }, [])
    return (
        <>
            <StatusBar style="dark" />
            <View style={{ marginTop: 100 }}>
                <ATextInput value={target} onValueChange={setTarget} placeholder="Address" keyboardType="ascii-capable" style={{ marginHorizontal: 16, marginVertical: 8 }} />
                <ATextInput value={amount} onValueChange={setAmount} placeholder="Amount" keyboardType="numeric" style={{ marginHorizontal: 16, marginVertical: 8 }} />
                <RoundButton title="Send" action={doSend} style={{ marginHorizontal: 16 }} />
                <RoundButton title="Scan" onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })} style={{ marginHorizontal: 16 }} />
            </View>
        </>
    );
});