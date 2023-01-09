import { useKeyboard } from "@react-native-community/hooks";
import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react"
import { Platform, Pressable, View, Text, Image, KeyboardAvoidingView, Keyboard } from "react-native"
import Animated, { measure, runOnUI, useAnimatedRef, useSharedValue, scrollTo, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AsyncLock, delay } from "teslabot";
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from "ton";
import { WalletV4Contract, WalletV4Source } from "ton-contracts";
import { TonPayloadFormat, TonTransport } from "ton-ledger";
import { AppConfig } from "../../AppConfig";
import { AddressDomainInput } from "../../components/AddressDomainInput";
import { ATextInput, ATextInputRef } from "../../components/ATextInput";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { useEngine } from "../../engine/Engine";
import { fetchMetadata } from "../../engine/metadata/fetchMetadata";
import { t } from "../../i18n/t";
import { useLinkNavigator } from "../../Navigation";
import { KnownWallets } from "../../secure/KnownWallets";
import { Theme } from "../../Theme";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { resolveUrl } from "../../utils/resolveUrl";
import { backoff } from "../../utils/time";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import MessageIcon from '../../../assets/ic_message.svg';
import { fragment } from "../../fragment";
import { estimateFees } from "../../engine/estimate/estimateFees";
import { createSimpleOrder } from "../secure/ops/Order";
import { useParams } from "../../utils/useParams";
import { contractFromPublicKey } from "../../engine/contractFromPublicKey";
import { useLedgerWallet } from "./components/LedgerApp";
import { fetchSeqno } from "../../engine/api/fetchSeqno";

export type LedgerTransferParams = {
    transport: TonTransport,
    account: number,
    addr: { address: string, publicKey: Buffer },
    balance: BN | null,
}

export const LedgerTransferFragment = fragment(() => {
    const {
        transport,
        account,
        addr,
        balance,
    } = useParams<LedgerTransferParams>();
    const engine = useEngine();
    const accountV4State = useLedgerWallet(engine, Address.parse(addr.address));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const config = engine.products.config.useConfig();

    let path = pathFromAccountNumber(account);

    const [target, setTarget] = React.useState('');
    const [addressDomainInput, setAddressDomainInput] = React.useState(target);
    const [domain, setDomain] = React.useState<string>();
    const [comment, setComment] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [stateInit, setStateInit] = React.useState<Cell | null>(null);
    const [estimation, setEstimation] = React.useState<BN | null>(null);
    const [progress, setProgress] = React.useState<'confirming' | 'sending' | 'sent'>();

    // Resolve order
    const order = React.useMemo(() => {
        // Parse value
        let value: BN;
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

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: comment,
            payload: null,
            amount: balance?.eq(value) ? toNano('0') : value,
            amountAll: balance?.eq(value) ? true : false,
            stateInit
        });
    }, [amount, target, domain, comment, stateInit]);

    const doSend = React.useCallback(async () => {
        // Parse value
        let value: BN;
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

        const contract = await contractFromPublicKey(addr.publicKey);
        const source = WalletV4Source.create({ workchain: 0, publicKey: addr.publicKey });

        try {
            // Fetch data
            const [[accountSeqno, account, targetState]] = await Promise.all([
                backoff('transfer-fetch-data', async () => {
                    let block = await backoff('ledger-lastblock', () => engine.client4.getLastBlock());
                    let seqno = await backoff('ledger-contract-seqno', () => fetchSeqno(engine.client4, block.last.seqno, contract.address));
                    return Promise.all([
                        seqno,
                        backoff('ledger-lite', () => engine.client4.getAccountLite(block.last.seqno, contract.address)),
                        backoff('ledger-target', () => engine.client4.getAccount(block.last.seqno, address))
                    ])
                }),
            ]);

            let bounce = targetState.account.state.type === 'active';

            // Signing
            let payload: TonPayloadFormat | undefined = undefined;
            if (comment.trim().length > 0) {
                payload = { type: 'comment', text: comment.trim() };
            }

            // Dismiss keyboard for iOS
            if (Platform.OS === 'ios') {
                Keyboard.dismiss();
            }

            setProgress('confirming');

            let signed = await transport.signTransaction(path, {
                to: address!,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                amount: value!,
                seqno: accountSeqno,
                timeout: Math.floor(Date.now() / 1e3) + 60000,
                bounce,
                payload
            });

            // Sending
            let extMessage = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: accountSeqno === 0 ? new StateInit({ code: source.initialCode, data: source.initialData }) : null,
                    body: new CellMessage(signed)
                })
            });
            let msg = new Cell();
            extMessage.writeTo(msg);

            // Transfer
            await backoff('ledger-transfer', async () => {
                try {
                    setProgress('sending');
                    await engine.client4.sendMessage(msg.toBoc({ idx: false }));
                } catch (error) {
                    console.warn(error);
                }
            });

            // Awaiting
            await backoff('tx-await', async () => {
                while (true) {
                    if (!account.account.last) {
                        return;
                    }
                    const lastBlock = await engine.client4.getLastBlock();
                    const lite = await engine.client4.getAccountLite(lastBlock.last.seqno, contract.address);

                    if (new BN(account.account.last.lt, 10).lt(new BN(lite.account.last?.lt ?? '0', 10))) {
                        setProgress('sent');
                        // Show success, then go back
                        setTimeout(() => {
                            navigation.goBack();
                        }, 1200);
                        return;
                    }

                    await delay(1000);
                }
            });
        } catch (e) {
            console.warn(e);
            setProgress(undefined);
        }

    }, [addr, target, amount, comment]);

    // Estimate fees
    const lock = React.useMemo(() => {
        return new AsyncLock();
    }, []);
    React.useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('ledger-transfer', async () => {
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
                let value: BN;
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

                const source = WalletV4Source.create({ workchain: 0, publicKey: addr.publicKey });
                // Load contract
                const contract = await contractFromPublicKey(addr.publicKey);
                const seqno = (await engine.client4.getLastBlock()).last.seqno;
                // Fetch account light state
                const accountState = (await backoff('account-state', () => engine.client4.getAccountLite(seqno, contract.address))).account;


                // Parse order
                let intMessage: InternalMessage;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY;

                intMessage = new InternalMessage({
                    to: address,
                    value: value,
                    bounce: false,
                    body: new CommonMessageInfo({
                        stateInit: accountV4State.seqno === 0 ? new StateInit({ code: source.initialCode, data: source.initialData }) : null,
                        body: order.payload ? new CellMessage(order.payload) : null
                    })
                });
                if (order.amountAll) {
                    sendMode = SendMode.CARRRY_ALL_REMAINING_BALANCE;
                }

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: accountV4State.seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode,
                    order: intMessage
                });
                if (ended) {
                    return;
                }

                // Resolve fee
                if (config) {
                    let inMsg = new Cell();
                    new ExternalMessage({
                        to: contract.address,
                        body: new CommonMessageInfo({
                            stateInit: accountV4State.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                            body: new CellMessage(transfer)
                        })
                    }).writeTo(inMsg);
                    let outMsg = new Cell();
                    intMessage.writeTo(outMsg);
                    let local = estimateFees(config, inMsg, outMsg, accountState.storageStat);
                    setEstimation(local);
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, config, comment]);

    const linkNavigator = useLinkNavigator();
    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src, AppConfig.isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                navigation.goBack();
                linkNavigator(res);
            } else {
                setAddressDomainInput(res.address.toFriendly({ testOnly: AppConfig.isTestnet }));
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
        if (balance) {
            setAmount(fromNano(balance));
        }
    }, [balance]);

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
        scrollTo(scrollRef, 0, Platform.OS === 'android' ? 400 : container.height, true);
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

    const isKnown: boolean = !!KnownWallets[target];
    const contact = engine.products.settings.useContact(target);

    return (
        <View style={{
            flexGrow: 1
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
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
                            {fromNano(balance || new BN(0))} {'TON'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }} collapsable={false}>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                            <Pressable
                                onPress={onAddAll}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? Theme.selector
                                            : 'white',
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_all_coins.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('transfer.sendAll')}</Text>
                                </View>
                            </Pressable>
                        </View>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: 'white', borderRadius: 14 }}>
                            <Pressable
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? Theme.selector
                                            : 'white',
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_scan_qr.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('transfer.scanQR')}</Text>
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
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
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
                    marginBottom: safeArea.bottom ?? 16
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                {progress === 'confirming' && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Text
                            style={{
                                fontWeight: '500',
                                fontSize: 16,
                                marginLeft: 16,
                                marginBottom: 16
                            }}
                        >
                            {t('hardwareWallet.actions.confirmOnLedger')}
                        </Text>
                    </Animated.View>
                )}
                {progress === 'sending' && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Text
                            style={{
                                fontWeight: '500',
                                fontSize: 16,
                                marginLeft: 16,
                                marginBottom: 16
                            }}
                        >
                            {t('hardwareWallet.actions.sending')}
                        </Text>
                    </Animated.View>
                )}
                {progress === 'sent' && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Text
                            style={{
                                fontWeight: '500',
                                fontSize: 16,
                                marginLeft: 16,
                                marginBottom: 16
                            }}
                        >
                            {t('hardwareWallet.actions.sent')}
                        </Text>
                    </Animated.View>
                )}
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