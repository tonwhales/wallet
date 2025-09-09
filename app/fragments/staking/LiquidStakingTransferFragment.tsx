import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { parseAmountToBn } from '../../utils/parseAmount';
import { ValueComponent } from '../../components/ValueComponent';
import { useParams } from '../../utils/useParams';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { Address, Builder, beginCell, fromNano, toNano } from '@ton/core';
import { useAccountLite, useIsLedgerRoute, useLiquidStakingMember, useNetwork, usePrice, useSelectedAccount, useTheme } from '../../engine/hooks';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { AboutIconButton } from '../../components/AboutIconButton';
import { StatusBar } from 'expo-status-bar';
import { useLiquidStaking } from '../../engine/hooks/staking/useLiquidStaking';
import { StakingTransferParams, actionTitle } from './StakingTransferFragment';
import { getLiquidStakingAddress } from '../../utils/KnownPools';
import { storeLiquidDeposit, storeLiquidWithdraw } from '../../utils/LiquidStakingContract';
import { ItemDivider } from '../../components/ItemDivider';
import { Typography } from '../../components/styles';
import { useValidAmount } from '../../utils/useValidAmount';
import { LiquidStakingAmountAction, liquidStakingAmountReducer } from '../../utils/staking/liquidStakingAmountReducer';
import { Image } from "expo-image";
import { AppsFlyerEvent } from '../../analytics/appsflyer';
import { trackAppsFlyerEvent } from '../../analytics/appsflyer';

export type LiquidStakingTransferParams = Omit<StakingTransferParams, 'target'>;

export const LiquidStakingTransferFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const params = useParams<LiquidStakingTransferParams>();
    const [price, currency] = usePrice();
    const selected = useSelectedAccount();

    const isLedger = useIsLedgerRoute()

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const accountLite = useAccountLite(selected!.address);
    const ledgerAccountLite = useAccountLite(ledgerAddress);
    const account = isLedger ? ledgerAccountLite : accountLite;
    const memberAddress = isLedger ? ledgerAddress : selected?.address;
    const safeArea = useSafeAreaInsets();
    const liquidStaking = useLiquidStaking().data;
    const member = useLiquidStakingMember(memberAddress)?.data;

    let initAmount = {
        ton: '',
        wsTon: ''
    }

    if (params?.action === 'top_up' && params.amount) {
        initAmount = liquidStakingAmountReducer(
            liquidStaking?.rateWithdraw ?? 0n,
            liquidStaking?.rateDeposit ?? 0n,
            'top_up'
        )(initAmount, { type: 'ton', amount: fromNano(params.amount ?? 0n) });
    }

    const [amount, dispatchAmount] = useReducer(
        liquidStakingAmountReducer(
            liquidStaking?.rateWithdraw ?? 0n,
            liquidStaking?.rateDeposit ?? 0n,
            params?.action === 'withdraw' ? 'withdraw' : 'top_up'
        ),
        initAmount
    );

    const [minAmountWarn, setMinAmountWarn] = useState<string>();
    const validAmount = useValidAmount(amount.ton);
    const validWsTonAmount = useValidAmount(amount.wsTon);

    const balance = useMemo(() => {
        if (params?.action === 'withdraw') {
            return BigInt(member?.balance ?? 0n);
        }
        if (params.action === 'top_up') {
            return account?.balance ?? 0n;
        }

        return 0n;
    }, [params.action, member, account]);

    const onSetAmount = useCallback((action: LiquidStakingAmountAction) => {
        setMinAmountWarn(undefined);
        dispatchAmount(action);
    }, []);

    const depositFee = useMemo(() => {
        return (liquidStaking?.extras.depositFee ?? toNano('0.1'))
            + (liquidStaking?.extras.receiptPrice ?? toNano('0.1'));
    }, [liquidStaking]);

    const doContinue = useCallback(async () => {

        if (params.action !== 'withdraw' && params.action !== 'top_up') {
            return;
        }

        const poolAddress = getLiquidStakingAddress(network.isTestnet);
        const target = poolAddress.toString({ testOnly: network.isTestnet });

        let transferAmountTon: bigint;
        let transferAmountWsTon: bigint;
        let minAmount = liquidStaking?.extras.minStake ?? toNano('1');
        minAmount += depositFee;

        try {
            // transferAmount = parseAmountToBn(amount);
            transferAmountTon = parseAmountToBn(amount.ton);
            transferAmountWsTon = parseAmountToBn(amount.wsTon);
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Check min stake amount
        if (params?.action === 'top_up' && transferAmountTon < minAmount) {
            setMinAmountWarn(t('products.staking.minAmountWarning', { minAmount: fromNano(minAmount) }));
            return;
        }

        // Check availible 
        if (params?.action === 'withdraw' && (!balance || balance < transferAmountWsTon)) {
            setMinAmountWarn(t('products.staking.transfer.notEnoughStaked'));
            return;
        }

        // Ledger transfer
        if (isLedger) {
            let ledgerPayload: TonPayloadFormat = {
                type: 'comment',
                text: 'Withdraw',
            };
            let actionText = t('transfer.title');

            if (params.action === 'withdraw') {
                transferAmountTon = liquidStaking
                    ? (liquidStaking.extras.withdrawFee + liquidStaking.extras.receiptPrice)
                    : toNano('0.2');
                actionText = t('products.staking.transfer.withdrawStakeTitle');
            } else if (params.action === 'top_up') {
                actionText = t('products.staking.transfer.topUpTitle');
                ledgerPayload.text = 'Deposit';
            }

            const text = t('products.staking.transfer.ledgerSignText', { action: actionText });
            navigation.navigateLedgerSignTransfer({
                order: {
                    type: 'ledger',
                    target: target,
                    payload: ledgerPayload,
                    amount: transferAmountTon,
                    amountAll: false,
                    stateInit: null,
                },
                text: text,
                callback: (ok: boolean) => {
                    if(ok) {
                        trackAppsFlyerEvent(AppsFlyerEvent.StakingDeposit, {
                            af_currency: 'TON',
                            af_quantity: transferAmountTon.toString()
                        });
                    }
                }
            });
            return;
        }

        // Add withdraw payload
        let payloadBuilder: Builder = beginCell();

        if (params?.action === 'withdraw') {
            payloadBuilder.store(storeLiquidWithdraw(0n, transferAmountWsTon, memberAddress))
            transferAmountTon = liquidStaking
                ? (liquidStaking.extras.withdrawFee + liquidStaking.extras.receiptPrice)
                : toNano('0.2');
        } else if (params.action === 'top_up') {
            payloadBuilder.store(storeLiquidDeposit(0n, transferAmountTon, memberAddress));
            transferAmountTon += liquidStaking
                ? (liquidStaking.extras.depositFee + liquidStaking.extras.receiptPrice)
                : toNano('0.2');
        } else {
            throw Error('Invalid action');
        }

        // Check amount
        if ((transferAmountTon === (account?.balance ?? 0n) || (account?.balance ?? 0n) < transferAmountTon)) {
            setMinAmountWarn(
                params.action === 'withdraw'
                    ? t(
                        'products.staking.transfer.notEnoughCoinsFee',
                        { amount: liquidStaking ? fromNano(liquidStaking.extras.withdrawFee + liquidStaking.extras.receiptPrice) : '0.2' }
                    )
                    : t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (transferAmountTon === 0n || transferAmountWsTon === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        // Navigate to TransferFragment
        navigation.navigateTransfer({
            order: {
                type: 'order',
                messages: [{
                    target,
                    payload: payloadBuilder.endCell(),
                    amount: transferAmountTon,
                    amountAll: false,
                    stateInit: null,
                }]
            },
            text: null,
            callback: (ok: boolean) => {
                if(ok) {
                    trackAppsFlyerEvent(AppsFlyerEvent.StakingDeposit, {
                        af_currency: 'TON',
                        af_quantity: transferAmountTon.toString()
                    });
                }
            }
        });
    }, [amount, params, member, liquidStaking, balance, network, depositFee]);

    //
    // Scroll state tracking
    //

    const [selectedInput, setSelectedInput] = React.useState(0);

    const refs = React.useMemo(() => {
        let r: React.RefObject<ATextInputRef>[] = [];
        for (let i = 0; i < 2; i++) {
            r.push(React.createRef());
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
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = useCallback((index: number) => {
        if (amount.ton === '0' || amount.wsTon === '0') {
            onSetAmount({ type: index === 0 ? 'ton' : 'wsTon', amount: '' });
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, [amount]);

    const onAddAll = useCallback(() => {
        let addAmount = balance;
        if (params?.action === 'top_up') {
            // Account for withdraw fee need to unstake 
            addAmount -= liquidStaking
                ? (
                    liquidStaking.extras.withdrawFee + liquidStaking.extras.receiptPrice  // saving up for the potential second 'withdraw' request
                    + liquidStaking.extras.depositFee + liquidStaking.extras.receiptPrice
                )
                : toNano('0.4');

            onSetAmount({ type: 'ton', amount: fromNano(addAmount) });
            return;
        }

        // withdraw
        if (addAmount > 0n) {
            onSetAmount({ type: 'wsTon', amount: fromNano(addAmount) });
        }
    }, [balance, params, liquidStaking]);

    useLayoutEffect(() => {
        setTimeout(() => refs[0]?.current?.focus(), 100);
    }, []);

    const priceText = useMemo(() => {
        if (!validAmount) {
            return;
        }
        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;
        return formatCurrency(
            (parseFloat(fromNano(abs)) * (price ? price?.price.usd * price.price.rates[currency] : 0)).toFixed(2),
            currency,
            isNeg
        );
    }, [validAmount, price, currency]);

    const amountError = useMemo(() => {
        if (!validAmount) {
            return undefined;
        }

        const isDeposit = params?.action === 'top_up';

        if (isDeposit && validAmount > balance) {
            return t('transfer.error.notEnoughJettons', { symbol: 'TON' });
        }
        if (!isDeposit && validWsTonAmount && validWsTonAmount > balance) {
            return t('transfer.error.notEnoughJettons', { symbol: 'wsTON' });
        }
        return undefined;
    }, [validAmount, balance, params?.action, validWsTonAmount]);

    const isContinueDisabled = useMemo(() => {
        return !!amountError || validAmount === 0n;
    }, [amountError, validAmount]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={actionTitle(params?.action)}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column', marginTop: 16 }}
                >
                    {params?.action === 'withdraw' ? (
                        <>
                            <View
                                style={{
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    padding: 20
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{
                                        height: 46, width: 46,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderRadius: 23,
                                        marginRight: 12
                                    }}>
                                        <Image
                                            source={require('@assets/ic-wston.png')}
                                            style={{
                                                height: 46,
                                                width: 46,
                                            }}
                                        />
                                        <View style={[{
                                            position: 'absolute',
                                            justifyContent: 'center', alignItems: 'center',
                                            bottom: -2, right: -2,
                                            width: 20, height: 20, borderRadius: 20,
                                            backgroundColor: theme.surfaceOnElevation
                                        }]}>

                                            <Image
                                                source={require('@assets/ic-verified.png')}
                                                style={{ width: 20, height: 20 }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flexGrow: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                                <Text style={{ color: theme.textSecondary }}>
                                                    {t('common.send')}
                                                </Text>
                                                {' wsTON'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                                {'Whales Liquid Token'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <ItemDivider marginHorizontal={0} marginVertical={20} />
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
                                            centFontStyle={{ opacity: 0.5 }}
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
                                    index={0}
                                    ref={refs[0]}
                                    onFocus={onFocus}
                                    value={amount.wsTon}
                                    onValueChange={(newVal) => {
                                        onSetAmount({ type: 'wsTon', amount: newVal });
                                    }}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: minAmountWarn ? theme.accentRed : theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'wsTON'}
                                    error={amountError}
                                />
                            </View>
                            <View
                                style={{
                                    marginBottom: 16,
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    padding: 20,
                                    marginTop: 16
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                        <Image
                                            source={require('@assets/ic-ton-acc.png')}
                                            style={{ height: 46, width: 46 }}
                                        />
                                        <View style={{
                                            justifyContent: 'center', alignItems: 'center',
                                            height: 20, width: 20, borderRadius: 10,
                                            position: 'absolute', right: -2, bottom: -2,
                                            backgroundColor: theme.surfaceOnBg
                                        }}>
                                            <Image
                                                source={require('@assets/ic-verified.png')}
                                                style={{ height: 20, width: 20 }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                        <Text
                                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                            ellipsizeMode="tail"
                                            numberOfLines={1}
                                        >
                                            <Text style={{ color: theme.textSecondary }}>
                                                {t('wallet.actions.receive')}
                                            </Text>
                                            {' TON'}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                                        >
                                            {'The Open Network'}
                                        </Text>
                                    </View>
                                </View>
                                <ATextInput
                                    index={1}
                                    ref={refs[1]}
                                    onFocus={onFocus}
                                    value={amount.ton}
                                    onValueChange={(newVal) => {
                                        onSetAmount({ type: 'ton', amount: newVal });
                                    }}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                        marginTop: 16
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: minAmountWarn ? theme.accentRed : theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'TON'}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <View
                                style={{
                                    marginBottom: 16,
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    padding: 20
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                        <Image
                                            source={require('@assets/ic-ton-acc.png')}
                                            style={{ height: 46, width: 46 }}
                                        />
                                        <View style={{
                                            justifyContent: 'center', alignItems: 'center',
                                            height: 20, width: 20, borderRadius: 10,
                                            position: 'absolute', right: -2, bottom: -2,
                                            backgroundColor: theme.surfaceOnBg
                                        }}>
                                            <Image
                                                source={require('@assets/ic-verified.png')}
                                                style={{ height: 20, width: 20 }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                        <Text
                                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                            ellipsizeMode="tail"
                                            numberOfLines={1}
                                        >
                                            <Text style={{ color: theme.textSecondary }}>
                                                {t('common.send')}
                                            </Text>
                                            {' TON'}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                                        >
                                            {'The Open Network'}
                                        </Text>
                                    </View>
                                </View>
                                <ItemDivider marginHorizontal={0} marginVertical={20} />
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
                                            centFontStyle={{ opacity: 0.5 }}
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
                                    index={0}
                                    ref={refs[0]}
                                    onFocus={onFocus}
                                    value={amount.ton}
                                    onValueChange={(newVal) => {
                                        onSetAmount({ type: 'ton', amount: newVal });
                                    }}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: minAmountWarn ? theme.accentRed : theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'TON'}
                                    error={amountError}
                                />
                            </View>
                            <View
                                style={{
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    padding: 20
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{
                                        height: 46, width: 46,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderRadius: 23,
                                        marginRight: 12
                                    }}>
                                        <Image
                                            source={require('@assets/ic-wston.png')}
                                            style={{
                                                height: 46,
                                                width: 46,
                                            }}
                                        />
                                        <View style={[{
                                            position: 'absolute',
                                            justifyContent: 'center', alignItems: 'center',
                                            bottom: -2, right: -2,
                                            width: 20, height: 20, borderRadius: 20,
                                            backgroundColor: theme.surfaceOnElevation
                                        }]}>

                                            <Image
                                                source={require('@assets/ic-verified.png')}
                                                style={{ width: 20, height: 20 }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flexGrow: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                                <Text style={{ color: theme.textSecondary }}>
                                                    {t('wallet.actions.receive')}
                                                </Text>
                                                {' wsTON'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                                {'Whales Liquid Token'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <ATextInput
                                    index={1}
                                    ref={refs[1]}
                                    onFocus={onFocus}
                                    value={amount.wsTon}
                                    onValueChange={(newVal) => {
                                        onSetAmount({ type: 'wsTon', amount: newVal });
                                    }}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                        marginTop: 16
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: minAmountWarn ? theme.accentRed : theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'wsTON'}
                                />
                            </View>
                        </>
                    )}
                    <View style={{
                        borderRadius: 20,
                        backgroundColor: theme.surfaceOnElevation,
                        padding: 20,
                        marginTop: 16
                    }}>
                        <Text style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                            {t('products.staking.pools.rateTitle')}
                        </Text>
                        <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {'1 TON = '}
                            <ValueComponent
                                value={(params.action === 'withdraw' ? liquidStaking?.rateWithdraw : liquidStaking?.rateDeposit) ?? 0n}
                                precision={9}
                                suffix={' wsTON'}
                            />
                        </Text>
                        <ItemDivider marginHorizontal={0} marginVertical={20} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                                    {params.action === 'withdraw' ? t('products.staking.info.withdrawFee') : t('products.staking.info.depositFee')}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                        <ValueComponent
                                            value={
                                                params.action === 'withdraw'
                                                    ? (liquidStaking?.extras.withdrawFee ?? 0n) + (liquidStaking?.extras.receiptPrice ?? 0n)
                                                    : (liquidStaking?.extras.depositFee ?? 0n) + (liquidStaking?.extras.receiptPrice ?? 0n)
                                            }
                                            precision={9}
                                            suffix={' TON'}
                                        />
                                    </Text>
                                    <PriceComponent
                                        amount={
                                            params.action === 'withdraw'
                                                ? (liquidStaking?.extras.withdrawFee ?? 0n) + (liquidStaking?.extras.receiptPrice ?? 0n)
                                                : (liquidStaking?.extras.depositFee ?? 0n) + (liquidStaking?.extras.receiptPrice ?? 0n)
                                        }
                                        style={{
                                            backgroundColor: theme.transparent,
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            paddingLeft: 6, paddingRight: 0,
                                            height: undefined
                                        }}
                                        theme={theme}
                                        textStyle={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                    />
                                </View>
                            </View>
                            <AboutIconButton
                                title={params.action === 'withdraw' ? t('products.staking.info.withdrawFee') : t('products.staking.info.depositFee')}
                                description={
                                    params.action === 'withdraw'
                                        ? t('products.staking.info.withdrawFeeDescription')
                                        : t('products.staking.info.depositFeeDescription', { amount: fromNano(depositFee) })
                                }
                                style={{ height: 24, width: 24, position: undefined }}
                                size={24}
                            />
                        </View>
                    </View>
                </View>
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.select({
                    ios: safeArea.top + 16,
                    android: 16
                })}
            >
                <RoundButton
                    title={t('common.continue')}
                    disabled={isContinueDisabled}
                    action={doContinue}
                />
            </KeyboardAvoidingView>
        </View>
    );
});