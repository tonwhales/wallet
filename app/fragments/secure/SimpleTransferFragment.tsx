import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable, StyleProp, ViewStyle, ScrollView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI, Layout, FadeOut, FadeIn, FadeOutDown, FadeInDown } from 'react-native-reanimated';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from 'ton';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useEngine } from '../../engine/Engine';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import { KnownJettonMasters, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { createJettonOrder, createSimpleOrder } from './ops/Order';
import { useItem } from '../../engine/persistence/PersistedItem';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { useRecoilValue } from 'recoil';
import { useLinkNavigator } from "../../useLinkNavigator";
import { fromBNWithDecimals, toBNWithDecimals } from '../../utils/withDecimals';
import { useParams } from '../../utils/useParams';
import { useAppConfig } from '../../utils/AppConfigContext';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RefObject, createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { WImage } from '../../components/WImage';
import { AddressSearch } from '../../components/address/AddressSearch';
import { AddressDomainInput } from '../../components/address/AddressDomainInput';
import { Avatar } from '../../components/Avatar';
import { usePrice } from '../../engine/PriceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { ValueComponent } from '../../components/ValueComponent';

import IcVerified from '@assets/ic-verified.svg';
import IcTonIcon from '@assets/ic_ton_account.svg';
import IcChevron from '@assets/ic_chevron_forward.svg';

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: BN | null,
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
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const acc = useMemo(() => getCurrentAddress(), []);
    const [price, currency] = usePrice();

    const [target, setTarget] = useState(params?.target || '');
    const [addressDomainInput, setAddressDomainInput] = useState(target);
    const [domain, setDomain] = useState<string>();
    const [comment, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = useState<BN | null>(null);
    const [jetton, setJetton] = useState<Address | null>(params?.jetton || null);

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

        let wallet = engine.persistence.jettonWallets.item(jetton).value;
        let master = null;
        let walletAddress = jetton;

        if (wallet?.master) {
            master = engine.persistence.jettonMasters.item(wallet.master).value;
        } else {
            master = engine.persistence.jettonMasters.item(jetton).value;
            engine.persistence.jettonWallets.each((key) => {
                const state = engine.persistence.jettonWallets.item(key).value;
                if (state?.master?.equals(jetton)) {
                    wallet = state;
                    walletAddress = key;
                    return;
                }
            });
        }

        if (!master || !wallet) {
            return null;
        }
        return { wallet, master, walletAddress };
    }, [jetton]);

    const validAmount = useMemo(() => {
        let value = null;
        try {
            const validAmount = amount.replace(',', '.');
            // Manage jettons with decimals
            if (jettonState) {
                value = toBNWithDecimals(validAmount, jettonState.master.decimals);
            } else {
                value = toNano(validAmount);
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
        return formatCurrency(
            (parseFloat(fromNano(validAmount.abs())) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            validAmount.isNeg()
        );
    }, [jettonState, validAmount, price, currency]);

    const isVerified = useMemo(() => {
        if (!jettonState || !jettonState.wallet.master) {
            return true;
        }
        return !!KnownJettonMasters(AppConfig.isTestnet)[jettonState.wallet.master.toFriendly({ testOnly: AppConfig.isTestnet })];
    }, [jettonState]);

    const balance = useMemo(() => {
        let value;
        if (jettonState) {
            value = jettonState.wallet.balance;
        } else {
            value = account.balance;
        }
        return value;
    }, [jettonState, account.balance]);

    const amountError = useMemo(() => {
        if (amount.length === 0) {
            return undefined;
        }
        if (!validAmount) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount.isNeg()) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount.gt(balance)) {
            return t('transfer.error.notEnoughCoins');
        }
        if (validAmount.eq(new BN(0))) {
            return t('transfer.error.zeroCoins');
        }

        return undefined;
    }, [validAmount, balance, amount]);

    const callback: ((ok: boolean, result: Cell | null) => void) | null = params && params.callback ? params.callback : null;

    // Auto-cancel job
    useEffect(() => {
        return () => {
            if (params && params.job) {
                engine.products.apps.commitCommand(false, params.job, new Cell());
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

        // Resolve jetton order
        if (jettonState) {
            return createJettonOrder({
                wallet: jettonState.walletAddress,
                target: target,
                domain: domain,
                responseTarget: acc.address,
                text: comment,
                amount: validAmount,
                tonAmount: toNano(0.1),
                txAmount: toNano(0.2),
                payload: null
            }, AppConfig.isTestnet);
        }

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: comment,
            payload: null,
            amount: validAmount.eq(account.balance) ? toNano('0') : validAmount,
            amountAll: validAmount.eq(account.balance),
            stateInit,
            app: params?.app
        });

    }, [validAmount, target, domain, comment, stateInit, jettonState, params?.app]);

    // Estimate fee
    const config = engine.products.config.useConfig();
    const accountState = useRecoilValue(engine.persistence.liteAccounts.item(engine.address).atom);
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
                const appState = getCurrentAddress();

                // Parse order
                let intMessage: InternalMessage;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY;
                if (!order) {
                    intMessage = new InternalMessage({
                        to: appState.address,
                        value: new BN(0),
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: stateInit ? new CellMessage(stateInit) : null,
                            body: new CommentMessage(comment)
                        })
                    });
                } else {
                    intMessage = new InternalMessage({
                        to: Address.parse(order.messages[0].target),
                        value: order.messages[0].amount,
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: order.messages[0].stateInit ? new CellMessage(order.messages[0].stateInit) : null,
                            body: order.messages[0].payload ? new CellMessage(order.messages[0].payload) : null
                        })
                    });
                    if (order.messages[0].amountAll) {
                        sendMode = SendMode.CARRRY_ALL_REMAINING_BALANCE;
                    }
                }

                // Load contract
                const contract = await contractFromPublicKey(appState.publicKey);

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: account.seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode,
                    order: intMessage
                });
                if (ended) {
                    return;
                }

                // Resolve fee
                if (config && accountState) {
                    let inMsg = new Cell();
                    new ExternalMessage({
                        to: contract.address,
                        body: new CommonMessageInfo({
                            stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                            body: new CellMessage(transfer)
                        })
                    }).writeTo(inMsg);
                    let outMsg = new Cell();
                    intMessage.writeTo(outMsg);
                    let local = estimateFees(config, inMsg, [outMsg], [accountState.storageStats]);
                    setEstimation(local);
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, account.seqno, config, accountState, comment]);

    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const onQRCodeRead = useCallback((src: string) => {
        let res = resolveUrl(src, AppConfig.isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                linkNavigator(res);
            } else {
                let mComment = comment;
                let mTarget = target;
                let mAmount = null;
                let mStateInit = stateInit;
                let mJetton = jetton;

                try {
                    mAmount = toNano(amount);
                } catch {
                    mAmount = null;
                }

                if (res.address) {
                    mTarget = res.address.toFriendly({ testOnly: AppConfig.isTestnet });
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

                navigation.navigateSimpleTransfer({
                    target: mTarget,
                    comment: mComment,
                    amount: mAmount,
                    stateInit: mStateInit,
                    jetton: mJetton,
                });
            }
        }
    }, [comment, target, amount, stateInit, jetton]);

    const onAddAll = useCallback(() => {
        setAmount(jettonState ? fromBNWithDecimals(balance, jettonState.master.decimals) : fromNano(balance));
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

    const isKnown: boolean = !!KnownWallets(AppConfig.isTestnet)[target];
    const contact = engine.products.settings.useContact(target);

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

        if (validAmount.isNeg()) {
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
        if (!validAmount.eq(balance) && balance.lt(validAmount)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (validAmount.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        setSelectedInput(null);
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        // Navigate to transaction confirmation
        navigation.navigateTransfer({
            text: comment,
            order,
            job: params && params.job ? params.job : null,
            callback,
            back: params && params.back ? params.back + 1 : undefined
        })
    }, [amount, target, domain, comment, account.seqno, stateInit, order, callback, jettonState]);

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

        const addressFriendly = targetAddressValid?.address.toFriendly({ testOnly: AppConfig.isTestnet });

        const saveButton = (
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginRight: 16 })}
                onPress={resetInput}
            >
                <Text style={{ color: Theme.accent, fontWeight: '500', fontSize: 17, lineHeight: 24 }}>
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
                            backgroundColor: Theme.border,
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
                            color: Theme.textPrimary,
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
                    onBackPressed: refs[0]?.current?.focus,
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
                    onBackPressed: refs[1]?.current?.focus,
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
                                backgroundColor: Theme.border,
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
                                                <IcVerified
                                                    height={16} width={16}
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
                                                color: Theme.textPrimary,
                                                fontWeight: '600',
                                                lineHeight: 24
                                            }}>
                                                {`${jettonState?.master.symbol ?? 'TON'}`}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: '400',
                                                    lineHeight: 20,
                                                    color: Theme.textSecondary,
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
                                backgroundColor: Theme.border,
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
                                    color: Theme.textSecondary,
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
                                        color: Theme.accent,
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
                                    backgroundColor: Theme.background,
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    borderRadius: 16,
                                }}
                                inputStyle={{
                                    fontSize: 17, fontWeight: '400',
                                    textAlignVertical: 'top',
                                    color: amountError ? Theme.accentRed : Theme.textPrimary,
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
                                    color: Theme.accentRed,
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
                            backgroundColor: Theme.border,
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
                                    fontWeight: '400', color: Theme.textPrimary,
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
                                        onSelect={(address) => {
                                            setAddressDomainInput(address.toFriendly({ testOnly: AppConfig.isTestnet }));
                                            setTarget(address.toFriendly({ testOnly: AppConfig.isTestnet }));
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
                            { marginTop: 16, backgroundColor: Theme.background },
                            seletectInputStyles.comment
                        ]}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: Theme.border,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20,
                        }}>
                            <ATextInput
                                value={comment}
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
                                    fontWeight: '400', color: Theme.textPrimary,
                                    textAlignVertical: 'center',
                                }}
                                multiline
                            />
                        </View>
                        {selected === 'comment' && (
                            <Animated.View layout={Layout.duration(300)}>
                                <Text style={{
                                    color: Theme.textSecondary,
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
                                    color: Theme.textSecondary,
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