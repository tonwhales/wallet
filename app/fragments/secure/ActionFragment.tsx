import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, Text, TextStyle, View, KeyboardAvoidingView, Alert } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommonMessageInfo, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { AsyncLock } from 'teslabot';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { getCurrentAddress } from '../../storage/appState';
import { WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { useAccount } from '../../sync/Engine';
import { Theme } from '../../Theme';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { fragment } from '../../fragment';
import { useRoute } from '@react-navigation/native';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
};

export const ActionFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const props: {
        target?: Address,
        comment?: string | null,
        amount?: BN | null,
        payload?: Cell | null,
        stateInit?: Cell | null,
    } | undefined = useRoute().params;
    const [account, engine] = useAccount();
    const [estimation, setEstimation] = React.useState<BN | null>(null);
    const acc = React.useMemo(() => getCurrentAddress(), []);

    const doSend = React.useCallback(async () => {
        if (!props?.target) {
            Alert.alert(t('Wrong address'), t('Please check the address'));
            return;
        }
        let address: Address;
        let value: BN;
        try {
            address = props?.target;
            value = props?.amount ? props.amount : toNano('0');
        } catch (e) {
            return;
        }

        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
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
                    stateInit: props?.stateInit ? new CellMessage(props.stateInit) : null,
                    body: props?.payload ? new CellMessage(props?.payload) : null
                })
            })
        });


        // Resolve fees
        const fee = await backoff(() => engine.connector.estimateExternalMessageFee(contract, transfer));

        // Sending transfer
        await backoff(() => engine.connector.client.sendExternalMessage(contract, transfer));

        // // Notify
        engine.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            fees: fee,
            amount: value.mul(new BN(-1)),
            address,
            seqno: account.seqno,
            kind: 'out',
            body: null,
            status: 'pending',
            time: Math.floor(Date.now() / 1000)
        });

        navigation.goBack();
    }, [account.seqno, props]);

    // Estimate fee
    const lock = React.useMemo(() => {
        return new AsyncLock();
    }, []);
    React.useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff(async () => {
                if (ended || !props?.target) {
                    return;
                }

                // Load app state
                const appState = getCurrentAddress();
                if (!appState) {
                    return;
                }

                // Parse address and value
                let address: Address;
                let value: BN;

                try {
                    address = props.target;
                    value = props.amount ? props.amount : toNano('0');
                } catch (e) {
                    address = appState.address;
                    value = new BN(0);
                }

                // Load contract
                const contract = await contractFromPublicKey(appState.publicKey);
                if (ended) {
                    return;
                }

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: account.seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                    order: new InternalMessage({
                        to: address,
                        value,
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: props.stateInit ? new CellMessage(props.stateInit) : null,
                            body: props.payload ? new CellMessage(props.payload) : undefined
                        })
                    })
                });
                if (ended) {
                    return;
                }

                // Check fees
                const fee = await engine.connector.estimateExternalMessageFee(contract, transfer);
                if (ended) {
                    return;
                }
                setEstimation(fee);
            });
        });
        return () => {
            ended = true;
        }
    }, [account.seqno, props]);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t("Action")} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flexGrow: 1, paddingTop: 16 }}
                keyboardVerticalOffset={16}
            >
                <StatusBar style="dark" />
                <ScrollView
                    style={{ paddingHorizontal: 16, flex: 1 }}
                >
                    {Platform.OS === 'ios' && (<Text style={[labelStyle, { textAlign: 'center' }]}>{t("Action")}</Text>)}
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingVertical: 19,
                        paddingHorizontal: 16
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#6D6D71',
                            marginBottom: 4,
                        }}>
                            {t('Amount')}
                        </Text>
                        <Text style={{
                            fontWeight: '800',
                            fontSize: 38,
                            color: Theme.accent
                        }}>
                            {props?.amount ? fromNano(props?.amount) : '0'}
                        </Text>
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingVertical: 10
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: '#6D6D71',
                            marginBottom: 4,
                            marginHorizontal: 16
                        }}>
                            {t('Wallet address')}
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            marginBottom: 10,
                            marginHorizontal: 16
                        }}>
                            {props?.target?.toFriendly()}
                        </Text>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                        {props?.comment && (
                            <>
                                <Text style={{
                                    fontSize: 12,
                                    color: '#6D6D71',
                                    marginBottom: 4,
                                    marginHorizontal: 16
                                }}>
                                    {t('Purpose of transaction')}
                                </Text>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    marginBottom: 10,
                                    marginHorizontal: 16
                                }}>
                                    {props.comment}
                                </Text>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                            </>
                        )}
                        <Text style={{ color: '#6D6D71', marginBottom: 4, marginLeft: 16, marginTop: 10, fontSize: 12 }}>
                            {t('Blockchain fee')}
                        </Text>
                        <Text style={{ marginLeft: 16, fontSize: 16 }}>
                            {estimation ? fromNano(estimation!) : '...'}
                        </Text>
                    </View>
                </ScrollView>
                <View style={[
                    {
                        marginHorizontal: 16, marginTop: 16,
                        paddingBottom: safeArea.bottom + 16
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
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )}
            </KeyboardAvoidingView>
        </>
    );
});