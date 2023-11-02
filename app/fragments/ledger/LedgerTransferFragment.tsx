import { useKeyboard } from "@react-native-community/hooks";
import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react"
import { Platform, Pressable, View, Text, Image, KeyboardAvoidingView, Keyboard } from "react-native"
import Animated, { measure, runOnUI, useAnimatedRef, useSharedValue, scrollTo, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AsyncLock } from "teslabot";
import { AddressDomainInput } from "../../components/AddressDomainInput";
import { ATextInput, ATextInputRef } from "../../components/ATextInput";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { KnownWallets } from "../../secure/KnownWallets";
import { resolveUrl } from "../../utils/resolveUrl";
import { backoff } from "../../utils/time";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import MessageIcon from '../../../assets/ic_message.svg';
import { createLedgerJettonOrder, createSimpleLedgerOrder } from "../secure/ops/Order";
import { contractFromPublicKey } from "../../engine/contractFromPublicKey";
import { useTransport } from "./components/TransportContext";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { SimpleTransferParams } from "../secure/SimpleTransferFragment";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { useTheme } from '../../engine/hooks/useTheme';
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useLedgerWallet } from '../../engine/hooks/useLedgerWallet';
import { useConfig } from '../../engine/hooks/useConfig';
import { useJettonWallet } from '../../engine/hooks/useJettonWallet';
import { useJettonMaster } from '../../engine/hooks/useJettonMaster';
import { useClient4 } from '../../engine/hooks/useClient4';
import { Address, WalletContractV4, internal, toNano, comment as commentCell, fromNano, SendMode, beginCell, external, storeMessage, storeMessageRelaxed, Cell } from '@ton/ton';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { estimateFees } from '../../utils/estimateFees';
import { useContact } from '../../engine/hooks/contacts/useContact';

export const LedgerTransferFragment = fragment(() => {
    const { addr } = useTransport();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const address = useMemo(() => {
        if (addr) {
            try {
                return Address.parse(addr.address);
            } catch {
                return null;
            }
        }
    }, [addr]);
    const params: SimpleTransferParams | undefined = useParams();

    const accountV4State = useLedgerWallet(address!);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const config = useConfig();

    // Input state
    const [target, setTarget] = React.useState(params?.target ?? '');
    const [addressDomainInput, setAddressDomainInput] = React.useState(target);
    const [domain, setDomain] = React.useState<string>();
    const [comment, setComment] = React.useState(params?.comment ?? '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = React.useState<Cell | null>(null);
    const jettonWallet = useJettonWallet(params.jetton);
    const jettonMaster = useJettonMaster(jettonWallet?.master || null);
    const symbol = jettonMaster ? jettonMaster.symbol! : 'TON'
    const balance = React.useMemo(() => {
        let value;
        if (jettonWallet) {
            value = jettonWallet.balance;
        } else {
            value = accountV4State?.balance ?? BigInt(0);
        }
        return value;
    }, [jettonWallet, jettonMaster, accountV4State?.balance]);

    const [estimation, setEstimation] = React.useState<bigint | null>(null);

    // Resolve order
    const order = React.useMemo(() => {
        // Parse value
        let value: bigint;
        try {
            const validAmount = amount.replace(',', '.');
            value = toNano(validAmount);
        } catch (e) {
            return null;
        }

        // Parse address
        let address: Address;
        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
        } catch (e) {
            return null;
        }

        // Resolve jetton order
        if (jettonWallet) {
            return createLedgerJettonOrder({
                wallet: Address.parse(params!.jetton!),
                target: target,
                domain: domain,
                responseTarget: address,
                text: comment,
                amount: value,
                tonAmount: toNano(0.1),
                txAmount: toNano(0.2),
                payload: null
            }, isTestnet);
        }

        // Resolve order
        return createSimpleLedgerOrder({
            target: target,
            domain: domain,
            text: comment,
            payload: null,
            amount: accountV4State?.balance?.eq(value) ? toNano('0') : value,
            amountAll: accountV4State?.balance?.eq(value) ? true : false,
            stateInit
        });
    }, [amount, target, domain, comment, stateInit]);

    const doSend = React.useCallback(async () => {
        // Parse value
        let value: bigint;
        try {
            const validAmount = amount.replace(',', '.');
            value = toNano(validAmount);
        } catch (e) {
            return null;
        }

        // Parse address
        let address: Address;
        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
        } catch (e) {
            return null;
        }

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        navigation.replace('LedgerSignTransfer', {
            text: null,
            order: order!,
        });

    }, [addr, target, amount, comment]);

    // Estimate fees
    const lock = React.useMemo(() => {
        return new AsyncLock();
    }, []);
    React.useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('ledger-transfer', async () => {
                if (!addr) {
                    return;
                }

                if (!accountV4State) {
                    return;
                }
                if (ended) {
                    return;
                }

                if (!order) {
                    return;
                }

                // Parse value
                let value: bigint;
                try {
                    const validAmount = amount.replace(',', '.');
                    value = toNano(validAmount);
                } catch (e) {
                    return null;
                }

                // Parse address
                let address: Address;
                try {
                    let parsed = Address.parseFriendly(target);
                    address = parsed.address;
                } catch (e) {
                    return null;
                }

                const source = WalletContractV4.create({ workchain: 0, publicKey: addr.publicKey });
                // Load contract
                const contract = await contractFromPublicKey(addr.publicKey);
                const seqno = (await client.getLastBlock()).last.seqno;
                // Fetch account light state
                const accountState = (await backoff('account-state', () => client.getAccountLite(seqno, contract.address))).account;


                // Parse order
                let intMessage = internal({
                    to: address,
                    value: value,
                    bounce: false,
                    body: commentCell(comment || ''),
                    init: accountV4State.seqno === 0 ? source.init : null
                });
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY;

                if (order.amountAll) {
                    sendMode = SendMode.CARRY_ALL_REMAINING_BALANCE;
                }

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: accountV4State.seqno,
                    secretKey: Buffer.from('ebac0c'),
                    sendMode,
                    messages: [intMessage]
                });
                if (ended) {
                    return;
                }

                // Resolve fee
                if (config) {
                    let e = external({
                        to: contract.address,
                        body: transfer,
                        init: accountV4State.seqno === 0 ? contract.init : null,
                    });
                    let inMsg = beginCell().store(storeMessage(e)).endCell();
                    let outMsg = beginCell().store(storeMessageRelaxed(intMessage)).endCell();
                    let local = estimateFees(config, inMsg, [outMsg], [accountState.storageStat]);
                    setEstimation(local);
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, config, comment]);

    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src, isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                navigation.goBack();

                const payloadOrder = createSimpleLedgerOrder({
                    target: res.address.toString({ testOnly: isTestnet }),
                    text: res.comment,
                    payload: res.payload,
                    amount: res.amount ? res.amount : BigInt(0),
                    amountAll: false,
                    stateInit: res.stateInit
                });

                navigation.navigateLedgerSignTransfer({
                    text: comment,
                    order: payloadOrder,
                });
            } else {
                setAddressDomainInput(res.address.toString({ testOnly: isTestnet }));
                if (res.amount) {
                    setAmount(fromNano(res.amount));
                }
                if (res.comment) {
                    setComment(res.comment);
                }
                if (res.stateInit) {
                    setStateInit(res.stateInit);
                } else {
                    setStateInit(null);
                }
            }
        }
    }, []);

    const onAddAll = React.useCallback(() => {
        setAmount(jettonWallet ? fromBnWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance));
    }, [balance, jettonWallet, jettonMaster]);

    //
    // Scroll state tracking
    //
    const [selectedInput, setSelectedInput] = React.useState(0);

    const refs = React.useMemo(() => {
        let r: React.RefObject<ATextInputRef>[] = [];
        for (let i = 0; i < 3; i++) {
            r.push(React.createRef());
        }
        return r;
    }, []);

    const keyboard = useKeyboard();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();

    const scrollToInput = React.useCallback((index: number) => {
        'worklet';

        if (index === 0) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        scrollTo(scrollRef, 0, Platform.OS === 'android' ? 400 : (container?.height ?? 0), true);
        return;

    }, []);

    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    React.useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = React.useCallback((index: number) => {
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = React.useCallback((index: number) => {
        let next = refs[index + 1].current;
        if (next) {
            next.focus();
        }
    }, []);

    const isKnown: boolean = !!KnownWallets(isTestnet)[target];
    const contact = useContact(target);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('transfer.title', { symbol: 'TON' })} />
            {Platform.OS !== 'android' && (
                <View style={{
                    paddingTop: 17,
                    paddingBottom: 17
                }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17,
                        textAlign: 'center'
                    }}>{t('transfer.title', { symbol: 'TON' })}</Text>
                </View>
            )}
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >

                    <View style={{
                        marginBottom: 16,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 15
                    }}>
                        <ATextInput
                            index={0}
                            ref={refs[0]}
                            onFocus={onFocus}
                            value={amount}
                            onValueChange={setAmount}
                            placeholder={'0'}
                            keyboardType={'numeric'}
                            textAlign={'center'}
                            style={{ backgroundColor: 'transparent' }}
                            fontWeight={'800'}
                            fontSize={30}
                            preventDefaultHeight
                            preventDefaultLineHeight
                            preventDefaultValuePadding
                            blurOnSubmit={false}
                        />
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#6D6D71',
                            marginBottom: 5
                        }}>
                            {jettonWallet ? fromBnWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance)} {symbol}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }} collapsable={false}>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                            <Pressable
                                onPress={onAddAll}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? theme.selector
                                            : 'white',
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_all_coins.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: theme.accentText, marginTop: 4 }}>{t('transfer.sendAll')}</Text>
                                </View>
                            </Pressable>
                        </View>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: 'white', borderRadius: 14 }}>
                            <Pressable
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? theme.selector
                                            : 'white',
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_scan_qr.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: theme.accentText, marginTop: 4 }}>{t('transfer.scanQR')}</Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <AddressDomainInput
                            input={addressDomainInput}
                            onInputChange={setAddressDomainInput}
                            target={target}
                            index={1}
                            ref={refs[1]}
                            onFocus={onFocus}
                            onTargetChange={setTarget}
                            onDomainChange={setDomain}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            isKnown={isKnown}
                            onSubmit={onSubmit}
                            contact={contact}
                            showToMainAddress
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 16 }} />
                        <ATextInput
                            value={comment}
                            index={2}
                            ref={refs[2]}
                            onFocus={onFocus}
                            onValueChange={setComment}
                            placeholder={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginHorizontal: 16 }}
                            preventDefaultHeight
                            multiline
                            label={
                                <View style={{
                                    flexDirection: 'row',
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden',
                                }}>
                                    <Text style={{
                                        fontWeight: '500',
                                        fontSize: 12,
                                        color: '#7D858A',
                                        alignSelf: 'flex-start',
                                    }}>
                                        {t('transfer.commentLabel')}
                                    </Text>
                                    {isKnown && (
                                        <Animated.View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            entering={FadeIn.duration(150)}
                                            exiting={FadeOut.duration(150)}
                                        >
                                            <MessageIcon
                                                width={12}
                                                height={12}
                                                style={{ alignSelf: 'center', marginRight: 4 }}
                                            />
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 12,
                                                color: '#858B93',
                                                alignSelf: 'flex-start',
                                            }}>
                                                {t('transfer.checkComment')}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                        />
                    </View>
                    <Text style={{ color: '#6D6D71', marginLeft: 16, fontSize: 13 }}>{t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}</Text>
                </View>
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + (Platform.OS === 'android' ? 16 : 0) ?? 16,

                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <View style={{
                    flexDirection: 'row'
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display={'secondary'}
                        onPress={navigation.goBack}
                        style={{
                            flex: 1,
                            marginRight: 4
                        }}
                    />
                    <RoundButton
                        title={t('common.confirm')}
                        action={doSend}
                        disabled={!order}
                        style={{
                            flex: 1,
                            marginLeft: 4
                        }}
                    />
                </View>
            </KeyboardAvoidingView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});