import { useKeyboard } from '@react-native-community/hooks';
import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, Text, TextStyle, View, Image, Pressable } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, CommentMessage, CommonMessageInfo, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { client } from '../../client';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useAccount } from '../../sync/useAccount';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { getAppState } from '../../utils/storage';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../utils/walletKeys';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
};

export const TransferFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const account = useAccount(address);
    const safeArea = useSafeAreaInsets();
    const scrollRef = React.useRef<ScrollView>(null);

    const [target, setTarget] = React.useState('');
    const [comment, setComment] = React.useState('');
    const [amount, setAmount] = React.useState('0');
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
            sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
            order: new InternalMessage({
                to: address,
                value,
                bounce: false,
                body: new CommonMessageInfo({
                    body: new CommentMessage(comment)
                })
            })
        })

        // Sending transfer
        await backoff(() => client.sendExternalMessage(contract, transfer));

        navigation.goBack();
    }, [amount, target, comment]);

    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src);
        if (res) {
            setTarget(res.address.toFriendly());
            if (res.amount) {
                setAmount(fromNano(res.amount));
            }
        }
    }, []);

    const keyboardHeight = useKeyboard().keyboardHeight;
    const keyboardShown = useKeyboard().keyboardShown;
    console.log('sendButtonAnimatedStyle', keyboardHeight);

    const sendButtonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateY: withTiming(
                    (
                        keyboardShown
                            ? - keyboardHeight
                            : 0
                    ),
                    {
                        duration: 200,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    })
            }],
        };
    }, [keyboardHeight, keyboardShown, safeArea, scrollRef]);

    return (
        <>
            <View style={{ flexGrow: 1 }}>
                <StatusBar style="dark" />
                <ScrollView
                    ref={scrollRef}
                    style={{ marginTop: (Platform.OS === 'android' ? safeArea.top : 0) + 16, paddingHorizontal: 16 }}
                    contentInset={{
                        bottom: keyboardShown ? keyboardHeight : undefined
                    }}
                >
                    <AndroidToolbar />
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t("Send Toncoin")}</Text>
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
                        paddingHorizontal: 16,
                        flexShrink: 1,
                    }}>
                        <ATextInput
                            value={target}
                            onValueChange={setTarget}
                            placeholder={t("Wallet adress")}
                            keyboardType="ascii-capable"
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0 }}
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
                        />
                        <ATextInput
                            value={comment}
                            onValueChange={setComment}
                            placeholder={t("Message to recipient (optional)")}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0 }}
                        />
                    </View>
                    {keyboardShown && keyboardHeight && (
                        <View style={{
                            height: keyboardHeight
                        }} />
                    )}
                </ScrollView>
                <Animated.View style={[
                    {
                        marginHorizontal: 16, marginTop: 16,
                        position: 'absolute',
                        bottom: safeArea.bottom ? (keyboardShown ? 16 : safeArea.bottom) : 16, left: 16, right: 16,
                    },
                    sendButtonAnimatedStyle
                ]}>
                    <RoundButton
                        title={t("Send")}
                        action={doSend}
                    />
                </Animated.View>
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            </View>
        </>
    );
});