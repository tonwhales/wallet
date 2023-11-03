import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Image, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, fromNano, loadStateInit, SendMode, comment, toNano, internal, MessageRelaxed, external, storeMessage, storeMessageRelaxed } from '@ton/core';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import MessageIcon from '../../../assets/ic_message.svg';
import { KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { createJettonOrder, createSimpleOrder } from './ops/Order';
import { useLinkNavigator } from "../../useLinkNavigator";
import { fromBnWithDecimals, toBnWithDecimals } from '../../utils/withDecimals';
import { AddressDomainInput } from '../../components/AddressDomainInput';
import { useParams } from '../../utils/useParams';
import { useAccountLite } from '../../engine/hooks';
import { useJettonWallet } from '../../engine/hooks';
import { useJettonMaster } from '../../engine/hooks';
import { useConfig } from '../../engine/hooks';
import { useContact } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { useClient4 } from '../../engine/hooks';
import { getLastBlock } from '../../engine/accountWatcher';
import { useCommitCommand } from '../../engine/hooks';
import { RefObject, createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { estimateFees } from '../../utils/estimateFees';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    fontSize: 17
};

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
    stateInit?: Cell | null,
    job?: string | null,
    jetton?: string | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string
    }
}

export const SimpleTransferFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected!.address)!;
    const tonClient4 = useClient4(isTestnet);
    const safeArea = useSafeAreaInsets();

    const [target, setTarget] = useState(params?.target || '');
    const [addressDomainInput, setAddressDomainInput] = useState(target);
    const [domain, setDomain] = useState<string>();
    const [text, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = useState<bigint | null>(null);
    const acc = useMemo(() => getCurrentAddress(), []);
    const jettonWallet = useJettonWallet(params.jetton, true);
    const jettonMaster = useJettonMaster(jettonWallet?.master!);
    const symbol = jettonMaster ? jettonMaster.symbol! : 'TON'
    const balance: bigint = useMemo(() => {
        let value;
        if (jettonWallet) {
            value = BigInt(jettonWallet.balance);
        } else {
            value = account.balance;
        }
        return value;
    }, [jettonWallet, jettonMaster, account.balance]);

    const commitCommand = useCommitCommand();
    const callback: ((ok: boolean, result: Cell | null) => void) | null = params && params.callback ? params.callback : null;

    // Auto-cancel job
    useEffect(() => {
        return () => {
            if (params && params.job) {
                commitCommand(false, params.job, new Cell());
            }
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    // Resolve order
    const order = useMemo(() => {

        // Parse value
        let value: bigint;
        try {
            const validAmount = amount.replace(',', '.').trim();
            // Manage jettons with decimals
            if (jettonMaster?.decimals) {
                value = toBnWithDecimals(validAmount, jettonMaster.decimals);
            } else {
                value = toNano(validAmount);
            }
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
            return createJettonOrder({
                wallet: Address.parse(params!.jetton!),
                target: target,
                domain: domain,
                responseTarget: acc.address,
                text: text,
                amount: value,
                tonAmount: toNano(0.1),
                txAmount: toNano(0.2),
                payload: null
            }, isTestnet);
        }

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: text,
            payload: null,
            amount: (value === account.balance) ? toNano('0') : value,
            amountAll: value === account.balance,
            stateInit,
            app: params?.app
        });

    }, [amount, target, domain, text, stateInit, jettonWallet, jettonMaster, params?.app]);

    const doSend = useCallback(async () => {

        let address: Address;
        let isTestOnly: boolean;
        let value: bigint;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
            isTestOnly = parsed.isTestOnly;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        try {
            const validAmount = amount.replace(',', '.');
            // Manage jettons with decimals
            if (jettonMaster?.decimals) {
                value = toBnWithDecimals(validAmount, jettonMaster.decimals);
            } else {
                value = toNano(validAmount);
            }
        } catch (e) {
            console.warn(e);
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        if (value < 0n) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Might not happen
        if (!order) {
            return;
        }

        // Load contract
        const contract = await contractFromPublicKey(acc.publicKey);

        // Check if same address
        if (address.equals(contract.address)) {
            Alert.alert(t('transfer.error.sendingToYourself'));
            return;
        }

        // Check amount
        if (value !== balance && balance < value) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (value === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        // Navigate to transaction confirmation
        navigation.navigateTransfer({
            text: text,
            order,
            job: params && params.job ? params.job : null,
            callback,
            back: params && params.back ? params.back + 1 : undefined
        })
    }, [amount, target, domain, text, stateInit, order, callback, jettonWallet, jettonMaster]);

    // Estimate fee
    const config = useConfig();
    const lock = useMemo(() => {
        return new AsyncLock();
    }, []);
    useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('simple-transfer', async () => {
                if (ended) {
                    return;
                }

                // Load app state
                const currentAddress = getCurrentAddress();

                let seqno = await fetchSeqno(tonClient4, await getLastBlock(), currentAddress.address);

                // Parse order
                let intMessage: MessageRelaxed;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY;

                let storageStats = [];

                const block = await backoff('transfer', () => tonClient4.getLastBlock());

                if (!order) {
                    const internalStateInit = !!stateInit
                        ? loadStateInit(stateInit.asSlice())
                        : null;

                    const body = comment(text);

                    intMessage = internal({
                        to: currentAddress.address,
                        value: 0n,
                        init: internalStateInit,
                        bounce: false,
                        body,
                    });

                    const state = await backoff('transfer', () => tonClient4.getAccount(block.last.seqno, currentAddress.address));
                    storageStats = state.account.storageStat ? [state.account.storageStat] : [];
                } else {
                    const internalStateInit = !!order.messages[0].stateInit
                        ? loadStateInit(order.messages[0].stateInit.asSlice())
                        : null;

                    const body = order.messages[0].payload ? order.messages[0].payload : null;

                    intMessage = internal({
                        to: Address.parse(order.messages[0].target),
                        value: 0n,
                        init: internalStateInit,
                        bounce: false,
                        body,
                    });

                    const state = await backoff('transfer', () => tonClient4.getAccount(block.last.seqno, Address.parse(order.messages[0].target)));
                    storageStats = state.account.storageStat ? [state.account.storageStat] : [];

                    if (order.messages[0].amountAll) {
                        sendMode = SendMode.CARRY_ALL_REMAINING_BALANCE;
                    }
                }

                // Load contract
                const contract = await contractFromPublicKey(currentAddress.publicKey);

                // Create transfer
                let transfer = contract.createTransfer({
                    seqno: seqno,
                    secretKey: Buffer.alloc(64),
                    sendMode,
                    messages: [intMessage],
                });


                if (ended) {
                    return;
                }

                // Resolve fee
                if (config && account) {
                    const externalMessage = external({
                        to: contract.address,
                        body: transfer,
                        init: seqno === 0 ? contract.init : null
                    });

                    let inMsg = new Cell().asBuilder();
                    storeMessage(externalMessage)(inMsg);

                    let outMsg = new Cell().asBuilder();
                    storeMessageRelaxed(intMessage)(outMsg);

                    let local = estimateFees(config, inMsg.endCell(), [outMsg.endCell()], storageStats);
                    setEstimation(local);
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, account, tonClient4, config, text]);

    const linkNavigator = useLinkNavigator(isTestnet);
    const onQRCodeRead = useCallback((src: string) => {
        let res = resolveUrl(src, isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                navigation.goBack();
                linkNavigator(res);
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

    const onAddAll = useCallback(() => {
        setAmount(jettonWallet ? fromBnWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance));
    }, [balance, jettonWallet, jettonMaster]);

    //
    // Scroll state tracking
    //

    const [selectedInput, setSelectedInput] = useState(0);

    const refs = useMemo(() => {
        let r: RefObject<ATextInputRef>[] = [];
        for (let i = 0; i < 3; i++) {
            r.push(createRef());
        }
        return r;
    }, []);

    const keyboard = useKeyboard();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();

    const scrollToInput = useCallback((index: number) => {
        'worklet';

        if (index === 0) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        if (Platform.OS !== 'android' && container) {
            scrollTo(scrollRef, 0, container.height, true);
        }
        if (Platform.OS === 'android') {
            scrollTo(scrollRef, 0, 400, true);
        }
        return;

    }, []);

    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = useCallback((index: number) => {
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = useCallback((index: number) => {
        let next = refs[index + 1].current;
        if (next) {
            next.focus();
        }
    }, []);

    const isKnown: boolean = !!KnownWallets(isTestnet)[target];
    const contact = useContact(target);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.title', { symbol })} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 17,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('transfer.title', { symbol })}</Text>
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
                        backgroundColor: theme.item,
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
                            style={{ backgroundColor: theme.transparent }}
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
                            color: theme.priceSecondary,
                            marginBottom: 5
                        }}>
                            {jettonWallet ? fromBnWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance)} {symbol}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }} collapsable={false}>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: theme.item, borderRadius: 14 }}>
                            <Pressable
                                onPress={onAddAll}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? theme.selector
                                            : theme.item,
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
                        <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: theme.item, borderRadius: 14 }}>
                            <Pressable
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? theme.selector
                                            : theme.item,
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
                        backgroundColor: theme.item,
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
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            isKnown={isKnown}
                            onSubmit={onSubmit}
                            contact={contact}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 16 }} />
                        <ATextInput
                            value={text}
                            index={2}
                            ref={refs[2]}
                            onFocus={onFocus}
                            onValueChange={setComment}
                            placeholder={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            style={{ backgroundColor: theme.transparent, paddingHorizontal: 0, marginHorizontal: 16 }}
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
                                        color: theme.label,
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
                                                color: theme.labelSecondary,
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
                    <Text style={{ color: theme.priceSecondary, marginLeft: 16, fontSize: 13 }}>{t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}</Text>
                </View>
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <RoundButton
                    title={t('common.continue')}
                    action={doSend}
                />
            </KeyboardAvoidingView>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </>
    );
});