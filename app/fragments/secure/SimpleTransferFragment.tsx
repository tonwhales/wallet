import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { FadeOut, FadeIn, LinearTransition, Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import { KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { LedgerOrder, Order, createJettonOrder, createLedgerJettonOrder, createSimpleLedgerOrder, createSimpleOrder } from './ops/Order';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useParams } from '../../utils/useParams';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ReactNode, RefObject, createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatAmount, formatCurrency, formatInputAmount } from '../../utils/formatCurrency';
import { ValueComponent } from '../../components/ValueComponent';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useAccountLite, useClient4, useConfig, useJetton, useNetwork, usePrice, useSelectedAccount, useTheme, useVerifyJetton } from '../../engine/hooks';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { fromBnWithDecimals, toBnWithDecimals } from '../../utils/withDecimals';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { getLastBlock } from '../../engine/accountWatcher';
import { MessageRelaxed, loadStateInit, comment, internal, external, fromNano, Cell, Address, toNano, SendMode, storeMessage, storeMessageRelaxed } from '@ton/core';
import { estimateFees } from '../../utils/estimateFees';
import { resolveLedgerPayload } from '../ledger/utils/resolveLedgerPayload';
import { AddressInputState, TransferAddressInput } from '../../components/address/TransferAddressInput';
import { ItemDivider } from '../../components/ItemDivider';
import { AboutIconButton } from '../../components/AboutIconButton';
import { setStatusBarStyle, StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native-gesture-handler';
import { TransferHeader } from '../../components/transfer/TransferHeader';
import { JettonIcon } from '../../components/products/JettonIcon';
import { AnimTextInputRef } from '../../components/address/AddressDomainInput';
import { Typography } from '../../components/styles';
import { useWalletVersion } from '../../engine/hooks/useWalletVersion';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { WalletVersions } from '../../engine/types';
import { useGaslessConfig } from '../../engine/hooks/jettons/useGaslessConfig';
import { useJettonPayload } from '../../engine/hooks/jettons/useJettonPayload';
import { useHoldersAccountTrargets } from '../../engine/hooks/holders/useHoldersAccountTrargets';
import { AddressSearchItem } from '../../components/address/AddressSearch';
import { Image } from 'expo-image';
import { mapJettonToMasterState } from '../../utils/jettons/mapJettonToMasterState';
import { JettonViewType } from '../wallet/AssetsFragment';

import IcChevron from '@assets/ic_chevron_forward.svg';

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
    payload?: Cell | null,
    feeAmount?: bigint | null,
    forwardAmount?: bigint | null,
    stateInit?: Cell | null,
    jetton?: Address | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string,
        url: string,
    }
}

const SimpleTransferComponent = () => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const route = useRoute();
    const knownWallets = KnownWallets(network.isTestnet);
    const isLedger = route.name === 'LedgerSimpleTransfer';
    const safeArea = useSafeAreaInsets();
    const acc = useSelectedAccount();
    const client = useClient4(network.isTestnet);
    const [price, currency] = usePrice();
    const gaslessConfig = useGaslessConfig();
    const gaslessConfigLoading = gaslessConfig?.isFetching || gaslessConfig?.isLoading;

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
    const address = isLedger ? ledgerAddress! : acc!.address;

    const accountLite = useAccountLite(address);
    const holdersAccounts = useHoldersAccountTrargets(address!);

    const [addressDomainInputState, setAddressDomainInputState] = useState<AddressInputState>(
        {
            input: params?.target || '',
            target: params?.target || '',
            domain: undefined,
            suffix: undefined,
        }
    );

    const { target, input: addressDomainInput, domain } = addressDomainInputState;

    const [commentString, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = useState<Cell | null>(params?.stateInit || null);
    const [selectedJetton, setJetton] = useState<Address | null>(params?.jetton || null);
    const estimationRef = useRef<bigint | null>(null);
    const [estimation, setEstimation] = useState<bigint | null>(estimationRef.current);

    // custom payload
    const payload = params.payload ?? null
    // jetton transfer params
    const forwardAmount = params.forwardAmount ?? null;
    const feeAmount = params.feeAmount ?? null;

    const jetton = useJetton({
        owner: address?.toString({ testOnly: network.isTestnet }),
        wallet: selectedJetton?.toString({ testOnly: network.isTestnet })
    });
    const hasGaslessTransfer = gaslessConfig?.data?.gas_jettons.map((j) => {
        return Address.parse(j.master_id);
    }).some((j) => jetton?.master && j.equals(jetton.master));
    const symbol = jetton ? jetton.symbol : 'TON';
    const { data: jettonPayload, loading: isJettonPayloadLoading } = useJettonPayload(
        address?.toString({ testOnly: network.isTestnet }),
        jetton?.master?.toString({ testOnly: network.isTestnet })
    );

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

    const validAmount = useMemo(() => {
        let value: bigint | null = null;

        if (!amount) {
            return null;
        }

        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            // Manage jettons with decimals
            if (jetton) {
                value = toBnWithDecimals(valid, jetton?.decimals ?? 9);
            } else {
                value = toNano(valid);
            }
            return value;
        } catch {
            return null;
        }
    }, [amount, jetton]);

    const priceText = useMemo(() => {
        if (!price || jetton || !validAmount) {
            return undefined;
        }

        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [jetton, validAmount, price, currency]);

    const estimationPrise = useMemo(() => {
        if (!estimation || !price || !validAmount) {
            return undefined;
        }

        const isNeg = estimation < 0n;
        const abs = isNeg ? -estimation : estimation;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [price, currency, estimation]);

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master?.toString({ testOnly: network.isTestnet }),
    });

    const balance = useMemo(() => {
        let value: bigint;
        if (jetton) {
            value = jetton.balance;
        } else {
            value = accountLite?.balance || 0n;
        }
        return value;
    }, [jetton, accountLite?.balance, isLedger]);

    const callback: ((ok: boolean, result: Cell | null) => void) | null = params && params.callback ? params.callback : null;

    // Auto-cancel job
    useEffect(() => {
        return () => {
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    // Resolve known wallets params
    const known = knownWallets[targetAddressValid?.address.toString({ testOnly: network.isTestnet }) ?? ''];

    // Resolve order
    const order = useMemo(() => {
        if (validAmount === null) {
            return null
        }

        try {
            Address.parseFriendly(target);
        } catch (e) {
            return null;
        }

        if (
            (!!known && known.requireMemo)
            && (!commentString || commentString.length === 0)
        ) {
            return null;
        }

        const estim = estimationRef.current ?? toNano('0.1');

        if (isLedger && ledgerAddress) {
            // Resolve jetton order
            if (jetton) {
                const txForwardAmount = toNano('0.05') + estim;
                return createLedgerJettonOrder({
                    wallet: jetton.wallet,
                    target: target,
                    domain: domain,
                    responseTarget: ledgerAddress,
                    text: commentString,
                    amount: validAmount,
                    tonAmount: 1n,
                    txAmount: txForwardAmount,
                    payload: null
                }, network.isTestnet);
            }

            // Resolve order
            return createSimpleLedgerOrder({
                target: target,
                domain: domain,
                text: commentString,
                payload: null,
                amount: accountLite?.balance === validAmount ? toNano('0') : validAmount,
                amountAll: accountLite?.balance === validAmount ? true : false,
                stateInit
            });
        }

        // Resolve jetton order
        if (jetton) {
            const customPayload = jettonPayload?.customPayload ?? null;
            const customPayloadCell = customPayload ? Cell.fromBoc(Buffer.from(customPayload, 'base64'))[0] : null;
            const stateInit = jettonPayload?.stateInit ?? null;
            const stateInitCell = stateInit ? Cell.fromBoc(Buffer.from(stateInit, 'base64'))[0] : null;

            let txAmount = feeAmount ?? (toNano('0.05') + estim);

            if (!!stateInit || !!customPayload) {
                txAmount = feeAmount ?? (toNano('0.1') + estim);
            }

            const tonAmount = forwardAmount ?? 1n;

            return createJettonOrder({
                wallet: jetton.wallet,
                target: target,
                domain: domain,
                responseTarget: acc!.address,
                text: commentString,
                amount: validAmount,
                tonAmount,
                txAmount,
                customPayload: customPayloadCell,
                payload: payload,
                stateInit: stateInitCell
            }, network.isTestnet);
        }

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: commentString,
            payload: payload,
            amount: (validAmount === accountLite?.balance) ? toNano('0') : validAmount,
            amountAll: validAmount === accountLite?.balance,
            stateInit,
            app: params?.app
        });

    }, [validAmount, target, domain, commentString, stateInit, jetton, params?.app, acc, ledgerAddress, known, jettonPayload]);

    const walletVersion = useWalletVersion();
    const isV5 = walletVersion === WalletVersions.v5R1;
    const supportsGaslessTransfer = hasGaslessTransfer && isV5;

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
                const currentAcc = getCurrentAddress();
                const address = ledgerAddress ?? currentAcc.address;

                let seqno = await fetchSeqno(client, await getLastBlock(), address);

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
                        to: address,
                        value: 0n,
                        init: internalStateInit,
                        bounce: false,
                        body,
                    });

                    const state = await backoff('transfer', () => client.getAccount(block.last.seqno, address));
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
                            to: address,
                            value: 0n,
                            init: internalStateInit,
                            bounce: false,
                            body,
                        });

                        const state = await backoff('transfer', () => client.getAccount(block.last.seqno, address));
                        storageStats = state.account.storageStat ? [state.account.storageStat] : [];
                    }
                }

                // Load contract
                const pubKey = ledgerContext.addr?.publicKey ?? currentAcc.publicKey;
                const contract = await contractFromPublicKey(pubKey, walletVersion, network.isTestnet);

                const transferParams = {
                    seqno: seqno,
                    secretKey: Buffer.alloc(64),
                    sendMode,
                    messages: [intMessage],
                };

                // Create transfer
                const transfer = isV5
                    ? (contract as WalletContractV5R1).createTransfer(transferParams)
                    : (contract as WalletContractV4).createTransfer(transferParams);

                if (ended) {
                    return;
                }

                // Resolve fee
                if (config && accountLite && !supportsGaslessTransfer) {
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
                    estimationRef.current = local;
                } else {
                    setEstimation(null);
                    estimationRef.current = null;
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, accountLite, client, config, commentString, ledgerAddress, walletVersion, supportsGaslessTransfer, jettonPayload?.customPayload, jettonPayload?.stateInit]);

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
                let mJetton = selectedJetton;

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
    }, [commentString, target, validAmount, stateInit, selectedJetton]);

    const onAddAll = useCallback(() => {
        const amount = jetton
            ? fromBnWithDecimals(balance, jetton.decimals)
            : fromNano(balance);
        const formatted = formatInputAmount(amount.replace('.', ','), jetton?.decimals ?? 9, { skipFormattingDecimals: true });
        setAmount(formatted);
    }, [balance, jetton]);

    //
    // Scroll state tracking
    //

    const hasParamsFilled = !!params.target && !!params.amount;
    const [selectedInput, setSelectedInput] = useState<number | null>(hasParamsFilled ? null : 0);

    const refs = useMemo(() => {
        let r: RefObject<ATextInputRef>[] = [];
        for (let i = 0; i < 3; i++) {
            r.push(createRef());
        }
        return r;
    }, []);

    const scrollRef = useRef<ScrollView>(null);

    const keyboard = useKeyboard();

    const onAssetSelected = useCallback((selected?: { master: Address, wallet?: Address }) => {
        if (selected && selected.wallet) {
            setJetton(selected.wallet);
            return;
        }
        setJetton(null);
    }, []);

    const doSend = useCallback(async () => {
        let address: Address;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (validAmount === null) {
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
        const contract = await contractFromPublicKey(acc!.publicKey, walletVersion, network.isTestnet);

        // Check if transfering to yourself
        if (isLedger && !ledgerAddress) {
            return;
        }

        if (address.equals(isLedger ? ledgerAddress! : contract.address)) {
            let allowSendingToYourself = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.sendingToYourself'), undefined, [
                    {
                        onPress: () => resolve(true),
                        text: t('common.continueAnyway')
                    },
                    {
                        onPress: () => resolve(false),
                        text: t('common.cancel'),
                        isPreferred: true,
                    }
                ]);
            });
            if (!allowSendingToYourself) {
                return;
            }
        }

        // Check amount
        if (balance < validAmount || balance === 0n) {
            Alert.alert(
                t('common.error'),
                t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (validAmount === 0n) {
            if (!!jetton) {
                Alert.alert(t('transfer.error.zeroCoins'));
                return;
            }
            let allowSeingZero = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.zeroCoinsAlert'), undefined, [
                    {
                        onPress: () => resolve(true),
                        text: t('common.continueAnyway')
                    },
                    {
                        onPress: () => resolve(false),
                        text: t('common.cancel'),
                        isPreferred: true,
                    }
                ]);
            });
            if (!allowSeingZero) {
                return;
            }
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
            callback,
            back: params && params.back ? params.back + 1 : undefined,
            useGasless: supportsGaslessTransfer
        });
    }, [
        amount, target, domain, commentString,
        accountLite,
        stateInit,
        order,
        callback,
        jetton,
        ledgerAddress,
        isLedger,
        balance,
        supportsGaslessTransfer
    ]);

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

    const holdersTarget = holdersAccounts?.find((a) => targetAddressValid?.address.equals(a.address));
    const holdersTargetJetton = holdersTarget?.jettonMaster ? Address.parse(holdersTarget.jettonMaster) : null;
    const jettonMaster = jetton?.master;
    const shouldAddMemo = holdersTarget?.memo ? (holdersTarget.memo !== commentString) : false;
    const shouldChangeJetton = holdersTargetJetton
        ? !jettonMaster?.equals(holdersTargetJetton)
        : holdersTarget && !!jetton && holdersTarget.symbol === 'TON';

    const amountError = useMemo(() => {
        if (shouldChangeJetton) {
            return t('transfer.error.jettonChange', { symbol: holdersTarget?.symbol });
        }

        if (amount.length === 0) {
            return undefined;
        }
        if (validAmount === null) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount < 0n) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount > balance) {
            return t('transfer.error.notEnoughCoins');
        }
        if (validAmount === 0n && !!jetton) {
            return t('transfer.error.zeroCoins');
        }

        return undefined;
    }, [validAmount, balance, amount, shouldChangeJetton, holdersTarget?.symbol]);

    // Resolve memo error string
    const commentError = useMemo(() => {
        const isEmpty = !commentString || commentString.length === 0;
        const isKnownWithMemo = !!known && known.requireMemo;

        if (isEmpty && isKnownWithMemo) {
            return t('transfer.error.memoRequired');
        }

        const validMemo = commentString === holdersTarget?.memo;

        if (shouldAddMemo && (isEmpty || !validMemo)) {
            return t('transfer.error.memoChange', { memo: holdersTarget?.memo });
        }

        return undefined;
    }, [commentString, known, shouldAddMemo, holdersTarget?.memo]);

    const { selected, onNext, header } = useMemo<{
        selected: 'amount' | 'address' | 'comment' | null,
        onNext: (() => void) | null,
        header: {
            onBackPressed?: () => void,
            title?: string,
            rightButton?: ReactNode,
            titleComponent?: ReactNode,
        }
    }>(() => {

        if (selectedInput === null) {
            return {
                selected: null,
                onNext: null,
                header: { title: t('transfer.title') }
            }
        }

        let headertitle: {
            onBackPressed?: () => void,
            title?: string,
            rightButton?: ReactNode,
            titleComponent?: ReactNode,
        } = { title: t('transfer.title') };

        if (targetAddressValid) {
            headertitle = {
                titleComponent: (
                    <TransferHeader
                        theme={theme}
                        address={targetAddressValid.address}
                        isTestnet={network.isTestnet}
                        bounceable={targetAddressValid.isBounceable}
                        knownWallets={knownWallets}
                    />
                )
            };
        }

        if (selectedInput === 0) {
            return {
                selected: 'address',
                onNext: targetAddressValid ? resetInput : null,
                header: {
                    title: t('common.recipient'),
                    titleComponent: undefined,
                }
            }
        }

        if (selectedInput === 1) {
            return {
                selected: 'amount',
                onNext: resetInput,
                header: { ...headertitle }
            }
        }

        if (selectedInput === 2) {
            return {
                selected: 'comment',
                onNext: resetInput,
                header: { ...headertitle }
            }
        }

        // Default
        return { selected: null, onNext: null, header: { ...headertitle } };
    }, [selectedInput, targetAddressValid, validAmount, refs, doSend, amountError]);

    const [addressInputHeight, setAddressInputHeight] = useState(0);
    const [amountInputHeight, setAmountInputHeight] = useState(0);

    const seletectInputStyles = useMemo<{
        amount: StyleProp<ViewStyle>,
        address: StyleProp<ViewStyle>,
        comment: StyleProp<ViewStyle>,
        fees: StyleProp<ViewStyle>,
    }>(() => {
        switch (selected) {
            case 'address':
                return {
                    address: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 1, zIndex: 1 },
                    amount: { opacity: 0, pointerEvents: 'none', height: 0 },
                    comment: { opacity: 0, pointerEvents: 'none', height: 0 },
                    fees: { opacity: 0, height: 0 },
                }
            case 'amount':
                return {
                    address: { opacity: 0, pointerEvents: 'none' },
                    amount: { position: 'relative', top: -addressInputHeight - 16, left: 0, right: 0, opacity: 1, zIndex: 1 },
                    comment: { opacity: 0, pointerEvents: 'none' },
                    fees: { opacity: 0, pointerEvents: 'none' },
                }
            case 'comment':
                return {
                    address: { opacity: 0, pointerEvents: 'none' },
                    amount: { opacity: 0, pointerEvents: 'none' },
                    comment: { position: 'absolute', top: -addressInputHeight - amountInputHeight - 32, left: 0, right: 0, opacity: 1, zIndex: 1 },
                    fees: { opacity: 0 },
                }
            default:
                return {
                    address: { opacity: 1 },
                    amount: { opacity: 1 },
                    comment: { opacity: 1 },
                    fees: { opacity: 1 }
                }
        }
    }, [selected, addressInputHeight, amountInputHeight]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0 });
    }, [selectedInput]);

    useFocusEffect(() => {
        setStatusBarStyle(Platform.select({
            android: theme.style === 'dark' ? 'light' : 'dark',
            ios: 'light',
            default: 'auto'
        }));
    });

    const continueDisabled = !order || gaslessConfigLoading || isJettonPayloadLoading || shouldChangeJetton || shouldAddMemo;
    const continueLoading = gaslessConfigLoading || isJettonPayloadLoading;

    const onSearchItemSelected = useCallback((item: AddressSearchItem) => {
        scrollRef.current?.scrollTo({ y: 0 });
        setComment(item.memo || '');
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                title={header.title}
                onBackPressed={header?.onBackPressed}
                titleComponent={header.titleComponent}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <ScrollView
                ref={scrollRef}
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={[
                    { marginHorizontal: 16, flexGrow: 1 },
                    Platform.select({ android: { minHeight: addressInputHeight } }),
                ]}
                contentInset={{
                    // bottom: 0.1,
                    bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - 86 - 32 : 0.1 /* Some weird bug on iOS */, // + 56 + 32
                    top: 0.1 /* Some weird bug on iOS */
                }}
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                keyboardDismissMode={'on-drag'}
                automaticallyAdjustContentInsets={false}
                scrollEnabled={!selectedInput}
                nestedScrollEnabled={!selectedInput}
            >
                <Animated.View
                    layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                    style={seletectInputStyles.address}
                    onLayout={(e) => { setAddressInputHeight(e.nativeEvent.layout.height) }}
                >
                    <TransferAddressInput
                        ref={refs[0] as RefObject<AnimTextInputRef>}
                        acc={ledgerAddress ?? acc!.address}
                        theme={theme}
                        target={target}
                        input={addressDomainInput}
                        domain={domain}
                        validAddress={targetAddressValid?.address}
                        isTestnet={network.isTestnet}
                        index={0}
                        onFocus={onFocus}
                        setAddressDomainInputState={setAddressDomainInputState}
                        onSubmit={onSubmit}
                        onQRCodeRead={onQRCodeRead}
                        isSelected={selected === 'address'}
                        onSearchItemSelected={onSearchItemSelected}
                        knownWallets={knownWallets}
                        navigation={navigation}
                        autoFocus={selectedInput === 0}
                    />
                </Animated.View>
                {selected === 'address' && (
                    <View style={{ height: addressInputHeight }} />
                )}
                <View style={{ marginTop: 16 }}>
                    <Animated.View
                        layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                        style={[seletectInputStyles.amount, { flex: 1 }]}
                        onLayout={(e) => setAmountInputHeight(e.nativeEvent.layout.height)}
                    >
                        <View
                            style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 20,
                                justifyContent: 'center',
                                padding: 20
                            }}
                        >
                            <Pressable
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                onPress={() => navigation.navigateAssets(
                                    {
                                        callback: onAssetSelected,
                                        selectedJetton: jetton?.master,
                                        jettonViewType: JettonViewType.Transfer
                                    },
                                    isLedger
                                )}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <View style={{ flexDirection: 'row', flexShrink: 1, overflow: 'hidden' }}>
                                        <View style={{
                                            height: 46, width: 46,
                                            justifyContent: 'center', alignItems: 'center',
                                            marginRight: 12
                                        }}>
                                            {!!jetton ? (
                                                <JettonIcon
                                                    isTestnet={network.isTestnet}
                                                    theme={theme}
                                                    size={46}
                                                    jetton={mapJettonToMasterState(jetton, network.isTestnet)}
                                                    backgroundColor={theme.elevation}
                                                    isSCAM={isSCAM}
                                                />
                                            ) : (
                                                <Image
                                                    source={require('@assets/ic-ton-acc.png')}
                                                    style={{ height: 46, width: 46 }}
                                                />
                                            )}
                                        </View>
                                        <View style={{ justifyContent: isSCAM ? 'space-between' : 'center', flexShrink: 1 }}>
                                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                                {symbol}
                                            </Text>
                                            {isSCAM && (
                                                <Text
                                                    style={{ flexShrink: 1 }}
                                                    numberOfLines={4}
                                                    ellipsizeMode={'tail'}
                                                >
                                                    <Text
                                                        style={[{ color: theme.accentRed }, Typography.regular15_20]}
                                                        selectable={false}
                                                    >
                                                        {'SCAM'}
                                                    </Text>
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                                </View>
                            </Pressable>
                            <ItemDivider marginHorizontal={0} />
                            <View style={{
                                flexDirection: 'row',
                                marginBottom: 12,
                                justifyContent: 'space-between'
                            }}>
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    {`${t('common.balance')}: `}
                                    <ValueComponent
                                        precision={4}
                                        value={balance}
                                        decimals={jetton ? jetton.decimals : undefined}
                                        suffix={jetton ? ` ${jetton.symbol}` : ''}
                                    />
                                </Text>
                                <Pressable
                                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    onPress={onAddAll}
                                >
                                    <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                                        {t('transfer.sendAll')}
                                    </Text>
                                </Pressable>
                            </View>
                            <ATextInput
                                index={1}
                                ref={refs[1]}
                                onFocus={onFocus}
                                value={amount}
                                onValueChange={(newVal) => {
                                    const formatted = formatInputAmount(newVal, jetton?.decimals ?? 9, { skipFormattingDecimals: true }, amount);
                                    setAmount(formatted);
                                }}
                                keyboardType={'numeric'}
                                style={{
                                    backgroundColor: theme.elevation,
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    borderRadius: 16,
                                }}
                                inputStyle={{
                                    fontSize: 17, fontWeight: '400',
                                    color: amountError ? theme.accentRed : theme.textPrimary,
                                    width: 'auto',
                                    flexShrink: 1
                                }}
                                suffix={priceText}
                                hideClearButton
                                prefix={jetton ? jetton.symbol : 'TON'}
                                cursorColor={theme.accent}
                            />
                            {amountError && (
                                <Animated.View entering={FadeIn} exiting={FadeOut.duration(100)}>
                                    <Text style={[{ color: theme.accentRed, marginTop: 8 }, Typography.regular13_18]}>
                                        {amountError}
                                    </Text>
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>
                </View>
                <View style={{ marginTop: 16 }}>
                    <Animated.View
                        layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                        style={[
                            seletectInputStyles.comment,
                            { flex: 1 }
                        ]}
                    >
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            paddingVertical: 20,
                            paddingHorizontal: (commentString.length > 0 && selected !== 'comment') ? 4 : 0,
                            width: '100%', borderRadius: 20,
                            overflow: 'hidden'
                        }}>
                            {payload ? (
                                <Text style={[{ color: theme.textPrimary, marginHorizontal: 16 }, Typography.regular17_24]}>
                                    {t('transfer.smartContract')}
                                </Text>
                            ) : (
                                <ATextInput
                                    value={commentString}
                                    index={2}
                                    ref={refs[2]}
                                    onFocus={onFocus}
                                    onValueChange={setComment}
                                    placeholder={!!known ? t('transfer.commentRequired') : t('transfer.comment')}
                                    keyboardType={'default'}
                                    autoCapitalize={'sentences'}
                                    label={!!known ? t('transfer.commentRequired') : t('transfer.comment')}
                                    style={{ paddingHorizontal: 16 }}
                                    inputStyle={[{ flexShrink: 1, color: theme.textPrimary, textAlignVertical: 'center' }, Typography.regular17_24]}
                                    multiline
                                    cursorColor={theme.accent}
                                />
                            )}
                        </View>
                        {!!commentError ? (
                            <Animated.View
                                style={{ marginTop: 2, marginLeft: 16 }}
                                entering={FadeInUp} exiting={FadeOutDown}
                                layout={LinearTransition.duration(200).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                            >
                                <Text style={{ color: theme.accentRed, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                                    {commentError}
                                </Text>
                            </Animated.View>
                        ) : ((selected === 'comment' && !known) && (
                            <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
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
                        ))}
                    </Animated.View>
                </View>
                {!!estimation && (
                    <View style={{ marginTop: 16 }}>
                        <Animated.View
                            layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                            style={[
                                seletectInputStyles.fees,
                                { flex: 1 }
                            ]}
                        >
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                padding: 20, borderRadius: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <View>
                                    <Text
                                        style={{
                                            color: theme.textSecondary,
                                            fontSize: 13, lineHeight: 18, fontWeight: '400',
                                            marginBottom: 2
                                        }}>
                                        {t('txPreview.blockchainFee')}
                                    </Text>
                                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                        {estimation
                                            ? <>
                                                {`${formatAmount(fromNano(estimation))} TON`}
                                            </>
                                            : '...'
                                        }
                                        {!!estimationPrise && (
                                            <Text style={[{ color: theme.textSecondary }, Typography.regular17_24]}>
                                                {` (${estimationPrise})`}
                                            </Text>

                                        )}
                                    </Text>
                                </View>
                                <AboutIconButton
                                    title={t('txPreview.blockchainFee')}
                                    description={t('txPreview.blockchainFeeDescription')}
                                    style={{ height: 24, width: 24, position: undefined }}
                                    size={24}
                                />
                            </View>
                        </Animated.View>
                    </View>
                )}
                <View style={{ height: 56 }} />
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[
                    { marginHorizontal: 16, marginTop: 16, },
                    Platform.select({
                        android: { marginBottom: safeArea.bottom + 16 },
                        ios: { marginBottom: safeArea.bottom + 32 }
                    })
                ]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 0}
            >
                {!!selected
                    ? <RoundButton
                        title={t('common.save')}
                        disabled={!onNext}
                        onPress={onNext ? onNext : undefined}
                    />
                    : <RoundButton
                        disabled={continueDisabled}
                        loading={continueLoading}
                        title={t('common.continue')}
                        action={doSend}
                    />
                }
            </KeyboardAvoidingView>
        </View>
    );
}

SimpleTransferComponent.name = 'SimpleTransfer';

export const SimpleTransferFragment = fragment(SimpleTransferComponent);