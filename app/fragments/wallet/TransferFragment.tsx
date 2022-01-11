import { useAppState } from '@react-native-community/hooks';
import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";
import { TextInput } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, CommonMessageInfo, EmptyMessage, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { client } from '../../client';
import { ATextInput } from '../../components/ATextInput';
import { ModalHeader } from '../../components/ModalHeader';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useAccount } from '../../sync/useAccount';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { decryptData } from '../../utils/secureStorage';
import { getAppState, storage } from '../../utils/storage';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../utils/walletKeys';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 16
};

export const TransferFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const account = useAccount(address);
    const safeArea = useSafeAreaInsets();

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
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys();
        } catch (e) {
            navigation.goBack();
            return;
        }

        // Transfer

        const contract = await contractFromPublicKey(walletKeys.keyPair.publicKey); // TODO Perform before key loading

        // Fetch seqno
        let seqno = await backoff(() => contract.getSeqNo(client));

        // Create transfer
        let transfer = await contract.createTransfer({
            seqno,
            walletId: contract.source.walletId,
            secretKey: walletKeys.keyPair.secretKey,
            sendMode: SendMode.IGNORE_ERRORS,
            order: new InternalMessage({
                to: address,
                value,
                bounce: false,
                body: new CommonMessageInfo({
                    body: new EmptyMessage()
                })
            })
        })

        // Sending transfer
        await backoff(() => client.sendExternalMessage(contract, transfer));

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
            <View style={{ marginTop: (Platform.OS === 'android' ? safeArea.top : 0) + 16 }}>

                <Text style={labelStyle}>{t("From account")}</Text>
                <View style={{ marginBottom: 16, marginHorizontal: 16 }}>
                    <Text style={{
                        fontWeight: '300',
                    }}>
                        {address.toFriendly()}
                    </Text>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 18
                    }}>
                        💎{fromNano(account?.balance || new BN(0))}
                    </Text>
                </View>

                <Text style={labelStyle}>{t("Amount")}</Text>
                <ATextInput
                    value={amount}
                    onValueChange={setAmount}
                    placeholder={t("Amount")}
                    keyboardType="numeric"
                    style={{ marginHorizontal: 16, marginVertical: 8 }}
                />

                <Text style={[labelStyle, { marginBottom: 8 }]}>{t("To")}</Text>
                <RoundButton title={t("Scan")} onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })} style={{ marginHorizontal: 16 }} />
                <ATextInput value={target} onValueChange={setTarget} placeholder={t("Address")} keyboardType="ascii-capable" style={{ marginHorizontal: 16, marginVertical: 8 }} />

                <RoundButton title={t("Send")} action={doSend} style={{ marginHorizontal: 16, marginTop: 16 }} />
            </View>
        </>
    );
});