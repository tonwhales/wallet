import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI, FadeIn, FadeOut } from 'react-native-reanimated';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { createWithdrawStakeCell } from '../../utils/staking/createWithdrawStakeCommand';
import { StakingCycle } from "../../components/staking/StakingCycle";
import { StakingCalcComponent } from '../../components/staking/StakingCalcComponent';
import { PoolTransactionInfo } from '../../components/staking/PoolTransactionInfo';
import { parseAmountToBn } from '../../utils/parseAmount';
import { ValueComponent } from '../../components/ValueComponent';
import { createAddStakeCommand } from '../../utils/staking/createAddStakeCommand';
import { useParams } from '../../utils/useParams';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatCurrency, formatInputAmount } from '../../utils/formatCurrency';
import { Address, Cell, beginCell, fromNano, toNano } from '@ton/core';
import { useAccountLite, useIsLedgerRoute, useNetwork, usePrice, useSelectedAccount, useStakingPool, useTheme } from '../../engine/hooks';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { AboutIconButton } from '../../components/AboutIconButton';
import { StatusBar } from 'expo-status-bar';
import { useValidAmount } from '../../utils/useValidAmount';
import { AppsFlyerEvent, trackAppsFlyerEvent } from '../../analytics/appsflyer';

export type TransferAction = 'withdraw' | 'top_up' | 'withdraw_ready';

export type StakingTransferParams = {
    target: string,
    amount?: string | null,
    lockAmount?: boolean,
    lockComment?: boolean,
    lockAddress?: boolean,
    action?: TransferAction
}

export function actionTitle(action?: TransferAction) {
    switch (action) {
        case 'withdraw':
            return t('products.staking.transfer.withdrawStakeTitle');
        case 'top_up':
            return t('products.staking.transfer.topUpTitle');
        case 'withdraw_ready':
            return t('products.staking.transfer.confirmWithdrawReady');
        default:
            return t('products.staking.title')
    }
}

export const StakingTransferFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const params = useParams<StakingTransferParams>();
    const [price, currency] = usePrice();
    const selected = useSelectedAccount();
    const target = Address.parse(params.target);

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
    const safeArea = useSafeAreaInsets();
    const pool = useStakingPool(target, isLedger ? ledgerAddress : selected!.address);
    const member = pool?.member;

    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [minAmountWarn, setMinAmountWarn] = useState<string>();
    const validAmount = useValidAmount(amount);

    let balance = account?.balance || 0n;
    if (params?.action === 'withdraw') {
        balance = member
            ? member.balance + member.withdraw + member.pendingDeposit
            : 0n;
    }

    if (params?.action === 'withdraw_ready') {
        balance = member?.withdraw || toNano(0);
    }

    const onSetAmount = useCallback((newAmount: string) => {
        setMinAmountWarn(undefined);
        setAmount(newAmount);
    }, []);

    const doContinue = useCallback(async () => {
        let value: bigint;
        let minAmount = pool?.params.minStake
            ? pool.params.minStake + (pool.params.receiptPrice) + (pool.params.depositFee)
            : toNano(network.isTestnet ? '10.2' : '50');

        if (!params?.target) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        try {
            value = parseAmountToBn(amount);
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Check min stake amount
        if (params?.action === 'top_up' && value < minAmount) {
            setMinAmountWarn(
                t('products.staking.minAmountWarning',
                    { minAmount: fromNano(minAmount) })
            );
            return;
        }

        // Check availible 
        if (params?.action === 'withdraw') {
            const availible = member
                ? member.balance + member.withdraw + member.pendingDeposit
                : undefined;
            if (!availible || availible < value) {
                setMinAmountWarn(t('products.staking.transfer.notEnoughStaked'));
                return;
            }
        }

        // Add withdraw payload
        let payload: Cell = beginCell().endCell();
        let transferAmount = value;

        if (isLedger) {
            let actionText = t('transfer.title');

            if (params.action === 'withdraw') {
                if (transferAmount === balance) {
                    transferAmount = 0n;
                }
                payload = createWithdrawStakeCell(transferAmount);
                transferAmount = pool
                    ? (pool.params.withdrawFee + pool.params.receiptPrice)
                    : toNano('0.2');
                actionText = t('products.staking.transfer.withdrawStakeTitle');
            } else if (params.action === 'top_up') {
                actionText = t('products.staking.transfer.topUpTitle');
                payload = createAddStakeCommand();
            } else if (params.action === 'withdraw_ready') {
                payload = createWithdrawStakeCell(transferAmount);
                transferAmount = pool
                    ? (pool.params.withdrawFee + pool.params.receiptPrice)
                    : toNano('0.2');
                actionText = t('products.staking.transfer.confirmWithdrawReady');
            }

            const text = t('products.staking.transfer.ledgerSignText', { action: actionText });

            const ledgerPayload: TonPayloadFormat = {
                type: 'unsafe',
                message: payload
            };

            navigation.navigateLedgerSignTransfer({
                order: {
                    type: 'ledger',
                    target: target.toString({ testOnly: network.isTestnet }),
                    payload: ledgerPayload,
                    amount: transferAmount,
                    amountAll: false,
                    stateInit: null,
                },
                text: text,
                callback: (ok: boolean) => {
                    if (ok) {
                        navigation.goBack();
                        trackAppsFlyerEvent(AppsFlyerEvent.StakingDeposit, {
                            af_currency: 'TON',
                            af_quantity: transferAmount.toString()
                        });
                    }
                }
            });
            return;
        }

        if (params.action === 'withdraw_ready') {
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool
                ? (pool.params.withdrawFee + pool.params.receiptPrice)
                : toNano('0.2');
        } else if (params?.action === 'withdraw') {
            if (transferAmount === balance) {
                transferAmount = 0n;
            }
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool
                ? (pool.params.withdrawFee + pool.params.receiptPrice)
                : toNano('0.2');
        } else if (params.action === 'top_up') {
            payload = createAddStakeCommand();
        } else {
            throw Error('Invalid action');
        }

        // Check amount
        if ((transferAmount === (account?.balance ?? 0n) || (account?.balance ?? 0n) < transferAmount)) {
            setMinAmountWarn(
                (params.action === 'withdraw' || params.action === 'withdraw_ready')
                    ? t(
                        'products.staking.transfer.notEnoughCoinsFee',
                        {
                            amount: pool
                                ? fromNano(pool.params.withdrawFee + pool.params.receiptPrice)
                                : '0.2'
                        })
                    : t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (transferAmount === 0n) {
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
                    target: target.toString({ testOnly: network.isTestnet }),
                    payload,
                    amount: transferAmount,
                    amountAll: false,
                    stateInit: null,
                }]
            },
            text: null,
            callback: (ok: boolean) => {
                if (ok) {
                    navigation.goBack();
                    trackAppsFlyerEvent(AppsFlyerEvent.StakingDeposit, {
                        af_currency: 'TON',
                        af_quantity: transferAmount.toString()
                    });
                }
            }
        });
    }, [amount, params, member, pool, balance]);

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
        if (amount === '0') {
            onSetAmount('');
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, [amount]);

    const onAddAll = useCallback(() => {
        let addAmount = balance;
        if (params?.action === 'top_up') {
            // Account for withdraw fee need to unstake 
            addAmount = addAmount
                - (pool?.params?.withdrawFee || toNano('0.1'))
                - (pool?.params?.receiptPrice || toNano('0.1'))
                - (pool?.params?.withdrawFee || toNano('0.1')) // saving up for the potential second 'withdraw' request
                - (pool?.params?.receiptPrice || toNano('0.1'))
        }
        if (addAmount > 0n) {
            const amount = fromNano(addAmount);
            const formatted = formatInputAmount(amount.replace('.', ','), 9, { skipFormattingDecimals: true });
            onSetAmount(formatted);
        }
    }, [balance, params, pool]);

    useLayoutEffect(() => {
        setTimeout(() => refs[0]?.current?.focus(), 100);
    }, []);

    const withdrawFee = pool
        ? (pool.params.withdrawFee + pool.params.receiptPrice) : toNano('0.2');

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
                    <View
                        style={{
                            marginTop: 16,
                            marginBottom: minAmountWarn ? 0 : 16,
                            backgroundColor: theme.surfaceOnElevation,
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
                                />
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
                            onValueChange={(newVal) => {
                                const formatted = formatInputAmount(newVal, 9, { skipFormattingDecimals: true }, amount);
                                onSetAmount(formatted);
                            }}
                            keyboardType={'numeric'}
                            style={{
                                backgroundColor: theme.backgroundPrimary,
                                paddingHorizontal: 16, paddingVertical: 14,
                                borderRadius: 16,
                            }}
                            inputStyle={{
                                fontSize: 17, fontWeight: '400',
                                color: minAmountWarn ? theme.accentRed : theme.textPrimary,
                                width: 'auto',
                                flexShrink: 1
                            }}
                            suffix={priceText}
                            hideClearButton
                            inputSuffix={'TON'}
                        />
                    </View>
                    {!!minAmountWarn && (
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
                                {minAmountWarn}
                            </Text>
                        </Animated.View>
                    )}

                    {params?.action === 'top_up' && pool && validAmount !== null && (
                        <>
                            <StakingCalcComponent
                                poolAddressString={target.toString({ testOnly: network.isTestnet })}
                                amount={validAmount}
                                topUp={params?.action === 'top_up'}
                                member={member}
                                fee={pool.params.poolFee}
                            />
                            <PoolTransactionInfo
                                poolAddressString={target.toString({ testOnly: network.isTestnet })}
                                pool={pool}
                            />
                        </>
                    )}
                    {(params?.action === 'withdraw' || params?.action === 'withdraw_ready') && (
                        <>
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginVertical: 16,
                                padding: 20
                            }}>
                                <View style={{
                                    flexDirection: 'row', width: '100%',
                                    justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <Text style={{
                                        fontSize: 15,
                                        fontWeight: '400',
                                        color: theme.textSecondary
                                    }}>
                                        {t('products.staking.info.withdrawFee')}
                                        <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                            <AboutIconButton
                                                title={t('products.staking.info.withdrawCompleteFee')}
                                                description={t('products.staking.info.withdrawFeeDescription')}
                                                style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                            />
                                        </View>
                                    </Text>
                                    <View style={{ justifyContent: 'center' }}>
                                        <Text style={{
                                            fontWeight: '400',
                                            fontSize: 17,
                                            color: theme.textPrimary
                                        }}>
                                            {`${fromNano(withdrawFee)} TON`}
                                        </Text>
                                        <PriceComponent
                                            amount={withdrawFee}
                                            style={{
                                                backgroundColor: theme.transparent,
                                                paddingHorizontal: 0, paddingVertical: 0,
                                                alignSelf: 'flex-end',
                                                height: 'auto'
                                            }}
                                            theme={theme}
                                            textStyle={{ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                                        />
                                    </View>
                                </View>
                            </View>
                            {!!pool && params.action !== 'withdraw_ready' && (
                                <StakingCycle
                                    stakeUntil={pool.status.proxyStakeUntil}
                                    locked={pool.status.locked}
                                    style={{
                                        marginBottom: 15,
                                        marginHorizontal: 0
                                    }}
                                    withdraw={true}
                                />
                            )}
                        </>
                    )}
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
                    action={doContinue}
                />
            </KeyboardAvoidingView>
        </View>
    );
});