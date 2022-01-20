import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, Text, TextStyle, View, Image, Pressable, KeyboardAvoidingView } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { useRoute } from '@react-navigation/native';
import { useAccount } from '../../sync/Engine';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
};

export const TransferFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const params: {
        target?: string,
        comment?: string | null,
        amount?: BN | null,
        payload?: Cell | null,
    } | undefined = useRoute().params;
    const [account, engine] = useAccount();
    const safeArea = useSafeAreaInsets();

    const [target, setTarget] = React.useState(params?.target || '');
    const [comment, setComment] = React.useState(params?.comment || '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '0');
    const [payload, setPayload] = React.useState<Cell | null>(params?.payload || null);
    const doSend = React.useCallback(async () => {
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

        // Load contract
        const contract = await contractFromPublicKey(walletKeys.keyPair.publicKey);

        // Create transfer
        let transfer = await contract.createTransfer({
            seqno: account.seqno,
            walletId: contract.source.walletId,
            secretKey: walletKeys.keyPair.secretKey,
            sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
            order: new InternalMessage({
                to: address,
                value,
                bounce: false,
                body: new CommonMessageInfo({
                    body: payload ? new CellMessage(payload) : new CommentMessage(comment)
                })
            })
        })

        // Sending transfer
        await backoff(() => engine.connector.client.sendExternalMessage(contract, transfer));

        navigation.goBack();
    }, [amount, target, comment, account.seqno, payload]);

    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src);
        if (res) {
            setTarget(res.address.toFriendly());
            if (res.amount) {
                setAmount(fromNano(res.amount));
            }
            if (res.comment) {
                setComment(res.comment);
            }
            if (res.payload) {
                setPayload(res.payload);
            } else {
                setPayload(null);
            }
        }
    }, []);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t("Send Toncoin")} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flexGrow: 1, paddingTop: 16 }}
                keyboardVerticalOffset={16}
            >
                <StatusBar style="dark" />
                <ScrollView
                    style={{ paddingHorizontal: 16, flex: 1 }}
                >
                    {Platform.OS === 'ios' && (<Text style={[labelStyle, { textAlign: 'center' }]}>{t("Send Toncoin")}</Text>)}
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 22
                    }}>
                        <ATextInput
                            value={amount}
                            onValueChange={setAmount}
                            placeholder={t("Amount")}
                            keyboardType={"decimal-pad"}
                            textAlign={'center'}
                            style={{ marginBottom: 20, backgroundColor: 'transparent' }}
                            fontWeight={'800'}
                            fontSize={38}
                            lineHeight={41}
                            preventDefaultHeight
                            preventDefaultValuePadding
                            enabled={!payload}
                        />
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#6D6D71'
                        }}>
                            {fromNano(account?.balance || new BN(0))} TON
                        </Text>
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 20 }}>{t("Send to")}</Text>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        // paddingHorizontal: 16,
                    }}>
                        <ATextInput
                            value={target}
                            onValueChange={setTarget}
                            placeholder={t("Wallet adress")}
                            keyboardType="ascii-capable"
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginHorizontal: 16 }}
                            actionButtonRight={
                                <Pressable
                                    style={{
                                        position: 'absolute',
                                        right: -3, top: 13, bottom: 13
                                    }}
                                    onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                >
                                    <Image
                                        style={{
                                            height: 24,
                                            width: 24
                                        }}
                                        source={require('../../../assets/ic_qr.png')}
                                    />
                                </Pressable>
                            }
                            enabled={!payload}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                        <ATextInput
                            value={comment}
                            onValueChange={setComment}
                            placeholder={t("Message to recipient (optional)")}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginHorizontal: 16 }}
                            enabled={!payload}
                        />
                    </View>
                </ScrollView>
                <View style={[
                    {
                        marginHorizontal: 16, marginTop: 16,
                        paddingBottom: safeArea.bottom + 16
                        // position: 'absolute',
                        // bottom: safeArea.bottom + 16, left: 16, right: 16,
                    },
                ]}>
                    <RoundButton
                        title={t("Send")}
                        action={doSend}
                    />
                </View>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={navigation.goBack}
                    />
                )}
            </KeyboardAvoidingView>
        </>
    );
});