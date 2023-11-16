import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable, StyleProp, ViewStyle, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI, Layout, FadeOut, FadeIn, FadeOutDown, FadeInDown } from 'react-native-reanimated';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import { KnownJettonMasters, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { LedgerOrder, Order, createJettonOrder, createLedgerJettonOrder, createSimpleLedgerOrder, createSimpleOrder } from './ops/Order';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useParams } from '../../utils/useParams';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RefObject, createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { WImage } from '../../components/WImage';
import { Avatar } from '../../components/Avatar';
import { formatCurrency } from '../../utils/formatCurrency';
import { ValueComponent } from '../../components/ValueComponent';
import { useRoute } from '@react-navigation/native';
import { useAccountLite, useClient4, useCommitCommand, useConfig, useContact, useJettonMaster, useJettonWallet, useNetwork, usePrice, useSelectedAccount, useTheme } from '../../engine/hooks';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { fromBnWithDecimals, toBnWithDecimals } from '../../utils/withDecimals';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { getLastBlock } from '../../engine/accountWatcher';
import { MessageRelaxed, loadStateInit, comment, internal, external, fromNano, Cell, Address, toNano, SendMode, storeMessage, storeMessageRelaxed } from '@ton/core';
import { estimateFees } from '../../utils/estimateFees';
import { AddressSearch } from '../../components/address/AddressSearch';
import { AddressDomainInput } from '../../components/address/AddressDomainInput';
import { resolveLedgerPayload } from '../ledger/utils/resolveLedgerPayload';

import IcTonIcon from '@assets/ic-ton-acc.svg';
import IcChevron from '@assets/ic_chevron_forward.svg';

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
    stateInit?: Cell | null,
    job?: string | null,
    jetton?: Address | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string
    }
}

export const SimpleTransferFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const route = useRoute();
    const isLedger = route.name === 'LedgerSimpleTransfer';
    const safeArea = useSafeAreaInsets();
    const acc = useSelectedAccount();
    const client = useClient4(network.isTestnet);
    const [price, currency] = usePrice();

    // Ledger
    const ledgerContext = useLedgerTransport();
    const addr = ledgerContext?.addr;
    const ledgerAddress = useMemo(() => {
        if (addr && isLedger) {
            try {
                return Address.parse(addr.address);
            } catch { }
        }
    }, [addr]);

    const account = useAccountLite(isLedger ? ledgerAddress : acc!.address);

    const [target, setTarget] = useState(params?.target || '');
    const [addressDomainInput, setAddressDomainInput] = useState(target);
    const [domain, setDomain] = useState<string>();
    const [commentString, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = useState<bigint | null>(null);
    const [jetton, setJetton] = useState<Address | null>(params?.jetton || null);

    const jettonWallet = useJettonWallet(jetton?.toString({ testOnly: network.isTestnet }), true);
    const jettonMaster = useJettonMaster(jettonWallet?.master!);
    const symbol = jettonMaster ? jettonMaster.symbol! : 'TON'

    const targetAddressValid = useMemo(() => {
        if (target.length > 48) {
            return null;
        }
        try {
            return Address.parseFriendly(target);
        } catch {
            return null;
        }
    }, [target]);

    const jettonState = useMemo(() => {
        if (!jetton) {
            return null;
        }

        if (!jettonWallet || !jettonMaster) {
            return null;
        }
        return { wallet: jettonWallet, master: jettonMaster, walletAddress: jetton };
    }, [jetton, jettonMaster, jettonWallet]);

    const validAmount = useMemo(() => {
        let value: bigint | null = null;
        try {
            const valid = amount.replace(',', '.');
            // Manage jettons with decimals
            if (jettonState) {
                value = toBnWithDecimals(valid, jettonState.master.decimals ?? 9);
            } else {
                value = toNano(valid);
            }
            return value;
        } catch {
            return null;
        }
    }, [amount, jettonState]);

    const priceText = useMemo(() => {
        if (!price || jettonState || !validAmount) {
            return undefined;
        }

        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [jettonState, validAmount, price, currency]);

    const isVerified = useMemo(() => {
        if (!jettonState || !jettonState.wallet.master) {
            return true;
        }
        return !!KnownJettonMasters(network.isTestnet)[jettonState.wallet.master];
    }, [jettonState]);

    const balance = useMemo(() => {
        let value: bigint;
        if (jettonState) {
            value = BigInt(jettonState.wallet.balance);
        } else {
            value = account?.balance || 0n;
        }
        return value;
    }, [jettonState, account?.balance, isLedger]);

    const amountError = useMemo(() => {
        if (amount.length === 0) {
            return undefined;
        }
        if (!validAmount) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount < 0n) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount > balance) {
            return t('transfer.error.notEnoughCoins');
        }
        if (validAmount === 0n) {
            return t('transfer.error.zeroCoins');
        }

        return undefined;
    }, [validAmount, balance, amount]);

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
        if (!validAmount) {
            return null
        }

        try {
            Address.parseFriendly(target);
        } catch (e) {
            return null;
        }

        if (isLedger && ledgerAddress) {
            // Resolve jetton order
            if (jettonState) {
                return createLedgerJettonOrder({
                    wallet: params!.jetton!,
                    target: target,
                    domain: domain,
                    responseTarget: ledgerAddress,
                    text: commentString,
                    amount: validAmount,
                    tonAmount: toNano(0.1),
                    txAmount: toNano(0.2),
                    payload: null
                }, network.isTestnet);
            }

            // Resolve order
            return createSimpleLedgerOrder({
                target: target,
                domain: domain,
                text: commentString,
                payload: null,
                amount: account?.balance === validAmount ? toNano('0') : validAmount,
                amountAll: account?.balance === validAmount ? true : false,
                stateInit
            });
        }

        // Resolve jetton order
        if (jettonState) {
            return createJettonOrder({
                wallet: jettonState.walletAddress,
                target: target,
                domain: domain,
                responseTarget: acc!.address,
                text: commentString,
                amount: validAmount,
                tonAmount: toNano(0.1),
                txAmount: toNano(0.2),
                payload: null
            }, network.isTestnet);
        }

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: commentString,
            payload: null,
            amount: (validAmount === account?.balance) ? toNano('0') : validAmount,
            amountAll: validAmount === account?.balance,
            stateInit,
            app: params?.app
        });

    }, [validAmount, target, domain, commentString, stateInit, jettonState, params?.app]);

    // Estimate fee
    const config = useConfig();
    const lock = useMemo(() => new AsyncLock(), []);
    useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('simple-transfer', async () => {
                if (ended) {
                    return;
                }

                // Load app state
                const currentAddress = getCurrentAddress();

                let seqno = await fetchSeqno(client, await getLastBlock(), ledgerAddress ?? currentAddress.address);

                // Parse order
                let intMessage: MessageRelaxed;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY;

                let storageStats: ({
                    lastPaid: number;
                    duePayment: string | null;
                    used: {
                        bits: number;
                        cells: number;
                        publicCells: number;
                    }
                } | null)[] = [];

                const block = await backoff('transfer', () => client.getLastBlock());

                if (!order) {
                    const internalStateInit = !!stateInit
                        ? loadStateInit(stateInit.asSlice())
                        : null;

                    const body = comment(commentString);

                    intMessage = internal({
                        to: currentAddress.address,
                        value: 0n,
                        init: internalStateInit,
                        bounce: false,
                        body,
                    });

                    const state = await backoff('transfer', () => client.getAccount(block.last.seqno, currentAddress.address));
                    storageStats = state.account.storageStat ? [state.account.storageStat] : [];
                } else {
                    if (order.type === 'order') {
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

                        const state = await backoff('transfer', () => client.getAccount(block.last.seqno, Address.parse(order.messages[0].target)));
                        storageStats = state.account.storageStat ? [state.account.storageStat] : [];

                        if (order.messages[0].amountAll) {
                            sendMode = SendMode.CARRY_ALL_REMAINING_BALANCE;
                        }
                    } else {
                        const internalStateInit = !!stateInit
                            ? loadStateInit(stateInit.asSlice())
                            : null;

                        const body = order.payload ? resolveLedgerPayload(order.payload) : comment(commentString);

                        intMessage = internal({
                            to: currentAddress.address,
                            value: 0n,
                            init: internalStateInit,
                            bounce: false,
                            body,
                        });

                        const state = await backoff('transfer', () => client.getAccount(block.last.seqno, currentAddress.address));
                        storageStats = state.account.storageStat ? [state.account.storageStat] : [];
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
    }, [order, account, client, config, commentString, ledgerAddress]);

    const linkNavigator = useLinkNavigator(network.isTestnet);
    const onQRCodeRead = useCallback((src: string) => {
        let res = resolveUrl(src, network.isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                linkNavigator(res);
            } else {
                let mComment = commentString;
                let mTarget = target;
                let mAmount = validAmount;
                let mStateInit = stateInit;
                let mJetton = jetton;

                try {
                    mAmount = toNano(amount);
                } catch {
                    mAmount = null;
                }

                if (res.address) {
                    mTarget = res.address.toString({ testOnly: network.isTestnet });
                }

                if (res.amount) {
                    mAmount = res.amount;
                }

                if (res.comment) {
                    mComment = res.comment;
                }
                if (res.stateInit) {
                    mStateInit = res.stateInit;
                } else {
                    mStateInit = null;
                }

                if (isLedger) {
                    navigation.navigateLedgerTransfer({
                        target: mTarget,
                        comment: mComment,
                        amount: mAmount,
                        stateInit: mStateInit,
                        jetton: mJetton,
                    });
                    return;
                }

                navigation.navigateSimpleTransfer({
                    target: mTarget,
                    comment: mComment,
                    amount: mAmount,
                    stateInit: mStateInit,
                    jetton: mJetton,
                });
            }
        }
    }, [commentString, target, validAmount, stateInit, jetton,]);

    const onAddAll = useCallback(() => {
        setAmount(
            jettonState
                ? fromBnWithDecimals(balance, jettonState.master.decimals)
                : fromNano(balance)
        );
    }, [balance, jettonState]);

    //
    // Scroll state tracking
    //

    const [selectedInput, setSelectedInput] = useState<number | null>(null);

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
        if (keyboard.keyboardShown && selectedInput !== null) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onAssetSelected = useCallback((selected?: { master: Address, wallet: Address }) => {
        if (selected) {
            setJetton(selected.wallet);
            return;
        }
        setJetton(null);
    }, []);

    const isKnown: boolean = !!KnownWallets(network.isTestnet)[target];
    const contact = useContact(target);

    const doSend = useCallback(async () => {
        let address: Address;
        let isTestOnly: boolean;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
            isTestOnly = parsed.isTestOnly;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (!validAmount) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        if (validAmount < 0n) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Might not happen
        if (!order) {
            return;
        }

        // Load contract
        const contract = await contractFromPublicKey(acc!.publicKey);

        // Check if same address
        if (isLedger) {
            if (!ledgerAddress) {
                return;
            }
            if (address.equals(ledgerAddress)) {
                Alert.alert(t('transfer.error.sendingToYourself'));
                return;
            }
        } else {
            if (address.equals(contract.address)) {
                Alert.alert(t('transfer.error.sendingToYourself'));
                return;
            }
        }

        // Check amount
        if (validAmount !== balance && balance < validAmount) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (validAmount === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        setSelectedInput(null);
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        if (isLedger) {
            navigation.replace('LedgerSignTransfer', {
                text: null,
                order: order as LedgerOrder,
            });
            return;
        }

        // Navigate to transaction confirmation
        navigation.navigateTransfer({
            text: commentString,
            order: order as Order,
            job: params && params.job ? params.job : null,
            callback,
            back: params && params.back ? params.back + 1 : undefined
        })
    }, [amount, target, domain, commentString, account, stateInit, order, callback, jettonState, ledgerAddress, isLedger]);

    const onFocus = useCallback((index: number) => {
        setSelectedInput(index);
    }, []);

    const onSubmit = useCallback((index: number) => {
        setSelectedInput(null);
    }, []);

    const resetInput = useCallback(() => {
        Keyboard.dismiss();
        setSelectedInput(null);
    }, []);

    const { selected, onNext, header } = useMemo<{
        selected: 'amount' | 'address' | 'comment' | null,
        onNext: (() => void) | null,
        header: {
            onBackPressed?: () => void,
            title?: string,
            rightButton?: React.ReactNode,
            titleComponent?: React.ReactNode,
        }
    }>(() => {

        if (selectedInput === null) {
            return {
                selected: null,
                onNext: null,
                header: {
                    title: t('transfer.title'),
                    onBackPressed: navigation.goBack
                }
            }
        }

        const addressFriendly = targetAddressValid?.address.toString({ testOnly: network.isTestnet });

        const saveButton = (
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginRight: 16 })}
                onPress={resetInput}
            >
                <Text style={{ color: theme.accent, fontWeight: '500', fontSize: 17, lineHeight: 24 }}>
                    {t('common.save')}
                </Text>
            </Pressable>
        );

        const headertitle = addressFriendly
            ? {
                titleComponent: (
                    <Animated.View
                        entering={FadeInDown} exiting={FadeOutDown}
                        style={{
                            backgroundColor: theme.border,
                            borderRadius: 100,
                            maxWidth: '70%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingLeft: 6, paddingRight: 12,
                            paddingVertical: 6
                        }}
                    >
                        <Avatar
                            size={24}
                            id={addressFriendly}
                            address={addressFriendly}
                            borderWith={0}
                        />
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary,
                            fontWeight: '500',
                            marginLeft: 6,
                            minHeight: 24
                        }}>
                            {addressFriendly.slice(0, 4) + '...' + addressFriendly.slice(-4)}
                        </Text>
                    </Animated.View>
                )
            }
            : {
                title: t('transfer.title'),
            }

        if (selectedInput === 0) {
            return {
                selected: 'amount',
                onNext: (validAmount && !amountError)
                    ? () => refs[1]?.current?.focus()
                    : null,
                header: {
                    onBackPressed: resetInput,
                    ...headertitle
                }
            }
        }

        if (selectedInput === 1) {
            return {
                selected: 'address',
                onNext: !!targetAddressValid
                    ? () => refs[2]?.current?.focus()
                    : null,
                header: {
                    onBackPressed: resetInput,
                    title: t('common.recipient'),
                    titleComponent: undefined,
                    rightButton: saveButton
                }
            }
        }

        if (selectedInput === 2) {
            return {
                selected: 'comment',
                onNext: resetInput,
                header: {
                    onBackPressed: resetInput,
                    ...headertitle,
                    rightButton: saveButton
                }
            }
        }

        // Default
        return { selected: null, onNext: null, header: { onBackPressed: navigation.goBack, ...headertitle } };
    }, [selectedInput, targetAddressValid, validAmount, refs, doSend, amountError]);

    const seletectInputStyles = useMemo<{
        amount: StyleProp<ViewStyle>,
        address: StyleProp<ViewStyle>,
        comment: StyleProp<ViewStyle>,
    }>(() => {
        switch (selected) {
            case 'amount':
                return {
                    amount: { position: 'absolute', top: 0, left: 0, right: 0 },
                    address: { position: 'absolute', top: 1000, left: 0, right: 0 },
                    comment: { position: 'absolute', top: 1000, left: 0, right: 0 },
                }
            case 'address':
                return {
                    amount: { position: 'absolute', top: -1000, left: 0, right: 0 },
                    address: { position: 'absolute', top: 16, left: 0, right: 0 },
                    comment: { position: 'absolute', top: 1000, left: 0, right: 0 },
                }

            case 'comment':
                return {
                    amount: { position: 'absolute', top: -1000, left: 0, right: 0 },
                    address: { position: 'absolute', top: -1000, left: 0, right: 0 },
                    comment: { position: 'absolute', top: 0, left: 0, right: 0 },
                }
            default:
                return {
                    amount: {},
                    address: {},
                    comment: {}
                }
        }
    }, [selected]);

    return (
        <Animated.View layout={Layout.duration(300)} style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={header.title}
                onBackPressed={header?.onBackPressed}
                titleComponent={header.titleComponent}
                rightButton={header.rightButton}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
            />
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                keyboardDismissMode={'none'}
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <Animated.View
                        layout={Layout.duration(300)}
                        style={seletectInputStyles.amount}
                    >
                        <View
                            style={{
                                backgroundColor: theme.border,
                                borderRadius: 20, padding: 20, marginTop: 16
                            }}
                        >
                            <Pressable
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                onPress={() => navigation.navigate(
                                    'Assets',
                                    { callback: onAssetSelected, selectedJetton: jettonState?.master }
                                )}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{
                                            height: 46, width: 46,
                                            justifyContent: 'center', alignItems: 'center',
                                            marginRight: 12
                                        }}>
                                            {!!jettonState && (
                                                <WImage
                                                    src={jettonState.master.image?.preview256}
                                                    blurhash={jettonState.master.image?.blurhash}
                                                    width={46}
                                                    heigh={46}
                                                    borderRadius={23}
                                                    lockLoading
                                                />
                                            )}
                                            {!jettonState && (<IcTonIcon width={46} height={46} />)}
                                            {isVerified && (
                                                <Image
                                                    source={require('@assets/ic-verified.png')}
                                                    style={{
                                                        height: 16, width: 16,
                                                        position: 'absolute', right: -2, bottom: -2,
                                                    }}
                                                />
                                            )}
                                        </View>
                                        <View style={{ justifyContent: 'space-between' }}>
                                            <Text style={{
                                                fontSize: 17,
                                                color: theme.textPrimary,
                                                fontWeight: '600',
                                                lineHeight: 24
                                            }}>
                                                {symbol}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: '400',
                                                    lineHeight: 20,
                                                    color: theme.textSecondary,
                                                }}
                                                selectable={false}
                                                ellipsizeMode={'middle'}
                                            >
                                                {`${jettonState?.master.description ?? 'The Open Network'}`}
                                            </Text>
                                        </View>
                                    </View>
                                    <IcChevron style={{ height: 16, width: 16 }} height={16} width={16} />
                                </View>
                            </Pressable>
                        </View>
                        <View
                            style={{
                                marginTop: 16,
                                marginBottom: amountError ? 0 : 16,
                                backgroundColor: theme.border,
                                borderRadius: 20,
                                justifyContent: 'center',
                                padding: 20
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                marginBottom: 12,
                                justifyContent: 'space-between'
                            }}>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 15, lineHeight: 20,
                                    color: theme.textSecondary,
                                }}>
                                    {`${t('common.balance')}: `}
                                    <ValueComponent
                                        precision={4}
                                        value={balance}
                                        centFontStyle={{ opacity: 0.5 }}
                                        decimals={jettonState ? jettonState.master.decimals : undefined}
                                    />
                                    {jettonState ? ` ${jettonState.master.symbol}` : ''}
                                </Text>
                                <Pressable
                                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    onPress={onAddAll}
                                >
                                    <Text style={{
                                        fontWeight: '500',
                                        fontSize: 15, lineHeight: 20,
                                        color: theme.accent,
                                    }}>
                                        {t('transfer.sendAll')}
                                    </Text>
                                </Pressable>
                            </View>
                            <ATextInput
                                index={0}
                                ref={refs[0]}
                                onFocus={onFocus}
                                value={amount}
                                onValueChange={setAmount}
                                keyboardType={'numeric'}
                                style={{
                                    backgroundColor: theme.backgroundPrimary,
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    borderRadius: 16,
                                }}
                                inputStyle={{
                                    fontSize: 17, fontWeight: '400',
                                    textAlignVertical: 'top',
                                    color: amountError ? theme.accentRed : theme.textPrimary,
                                    width: 'auto',
                                    flexShrink: 1
                                }}
                                suffux={priceText}
                                hideClearButton
                                prefix={jettonState ? (jettonState.master.symbol ?? '') : 'TON'}
                            />
                        </View>
                        {amountError && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <Text style={{
                                    color: theme.accentRed,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    marginTop: 8,
                                    marginBottom: 16,
                                    marginLeft: 20,
                                    fontWeight: '400'
                                }}>
                                    {amountError}
                                </Text>
                            </Animated.View>
                        )}
                    </Animated.View>
                    <Animated.View
                        layout={Layout.duration(300)}
                        style={seletectInputStyles.address}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: theme.border,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20,
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
                                style={{ paddingHorizontal: 16 }}
                                inputStyle={{
                                    flexShrink: 1,
                                    fontSize: 17,
                                    fontWeight: '400', color: theme.textPrimary,
                                    textAlignVertical: 'center',
                                }}
                                isKnown={isKnown}
                                onSubmit={onSubmit}
                                contact={contact}
                                onQRCodeRead={onQRCodeRead}
                                invalid={!targetAddressValid}
                            />
                        </View>
                        {selected === 'address' && (
                            <Animated.View
                                style={{ marginTop: 32, marginHorizontal: -16 }}
                                entering={FadeIn} exiting={FadeOut}
                            >
                                <ScrollView
                                    contentInset={{
                                        bottom: keyboard.keyboardHeight - safeArea.bottom - 16 - 56 - safeArea.top,
                                        top: 0.1 /* Some weird bug on iOS */
                                    }}
                                    contentContainerStyle={{ paddingHorizontal: 16 }}
                                    contentInsetAdjustmentBehavior={'never'}
                                    keyboardShouldPersistTaps={'always'}
                                    keyboardDismissMode={'none'}
                                >
                                    <AddressSearch
                                        account={ledgerAddress ?? acc!.address}
                                        onSelect={(address) => {
                                            setAddressDomainInput(address.toString({ testOnly: network.isTestnet }));
                                            setTarget(address.toString({ testOnly: network.isTestnet }));
                                            refs[2]?.current?.focus();
                                        }}
                                        query={addressDomainInput}
                                    />
                                </ScrollView>
                            </Animated.View>
                        )}
                    </Animated.View>
                    <Animated.View
                        layout={Layout.duration(300)}
                        style={[
                            { marginTop: 16, backgroundColor: theme.backgroundPrimary },
                            seletectInputStyles.comment
                        ]}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: theme.border,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20,
                        }}>
                            <ATextInput
                                value={commentString}
                                index={2}
                                ref={refs[2]}
                                onFocus={onFocus}
                                onValueChange={setComment}
                                placeholder={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                                keyboardType={'default'}
                                autoCapitalize={'sentences'}
                                label={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                                style={{ paddingHorizontal: 16 }}
                                inputStyle={{
                                    flexShrink: 1,
                                    fontSize: 17,
                                    fontWeight: '400', color: theme.textPrimary,
                                    textAlignVertical: 'center',
                                }}
                                multiline
                            />
                        </View>
                        {selected === 'comment' && (
                            <Animated.View layout={Layout.duration(300)}>
                                <Text style={{
                                    color: theme.textSecondary,
                                    fontSize: 13, lineHeight: 18,
                                    fontWeight: '400',
                                    paddingHorizontal: 16,
                                    marginTop: 2
                                }}>
                                    {t('transfer.commentDescription')}
                                </Text>
                            </Animated.View>
                        )}
                    </Animated.View>
                    {selectedInput === null && (
                        <Animated.View layout={Layout.duration(300)}>
                            <Text
                                style={{
                                    color: theme.textSecondary,
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    marginTop: 16,
                                }}>
                                {t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}
                            </Text>
                        </Animated.View>
                    )}
                </View>
                <View style={{ height: 56 }} />
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 32,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 16}
            >
                {!!selected
                    ? <RoundButton
                        title={selected === 'comment' ? t('common.done') : t('common.continue')}
                        disabled={!onNext}
                        onPress={onNext ? onNext : undefined}
                    />
                    : <RoundButton
                        disabled={!order}
                        title={t('common.send')}
                        action={doSend}
                    />
                }
            </KeyboardAvoidingView>
        </Animated.View>
    );
});