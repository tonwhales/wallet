import BN from 'bn.js';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI, FadeIn, FadeOut } from 'react-native-reanimated';
import { Address, Cell, CellMessage, fromNano, toNano } from 'ton';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useEngine } from '../../engine/Engine';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { createWithdrawStakeCell } from '../../utils/createWithdrawStakeCommand';
import { StakingCycle } from "../../components/staking/StakingCycle";
import { StakingCalcComponent } from '../../components/staking/StakingCalcComponent';
import { PoolTransactionInfo } from '../../components/staking/PoolTransactionInfo';
import { UnstakeBanner } from '../../components/staking/UnstakeBanner';
import { parseAmountToBn, parseAmountToNumber, parseAmountToValidBN } from '../../utils/parseAmount';
import { ValueComponent } from '../../components/ValueComponent';
import { createAddStakeCommand } from '../../utils/createAddStakeCommand';
import { useItem } from '../../engine/persistence/PersistedItem';
import { useParams } from '../../utils/useParams';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useLedgerTransport } from '../ledger/components/LedgerTransportProvider';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { usePrice } from '../../engine/PriceContext';
import { AboutIconButton } from '../../components/AboutIconButton';

export type TransferAction = 'deposit' | 'withdraw' | 'top_up' | 'withdraw_ready';

export type StakingTransferParams = {
    target?: Address,
    amount?: BN | null,
    lockAmount?: boolean,
    lockComment?: boolean,
    lockAddress?: boolean,
    action?: TransferAction
}

export function actionTitle(action?: TransferAction) {
    switch (action) {
        case 'deposit':
            return t('products.staking.transfer.depositStakeTitle');
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
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const params = useParams<StakingTransferParams>();
    const engine = useEngine();
    const [price, currency] = usePrice();

    const route = useRoute();
    const isLedger = route.name === 'LedgerStakingTransfer';

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch {
            return;
        }
    }, [ledgerContext?.addr?.address]);

    const currentAccount = useItem(engine.model.wallet(engine.address));
    const ledgerAccount = engine.products.ledger.useAccount();
    const account = isLedger ? ledgerAccount : currentAccount;
    const safeArea = useSafeAreaInsets();
    const pool = engine.products.whalesStakingPools.usePool(params.target, ledgerAddress);
    const member = pool?.member

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [minAmountWarn, setMinAmountWarn] = useState<string>();

    const validAmount = useMemo(() => {
        try {
            return toNano(amount);
        } catch {
            return undefined;
        }
    }, [amount]);

    let balance = account?.balance || new BN(0);
    if (params?.action === 'withdraw') {
        balance = member
            ? member!.balance.add(member!.withdraw).add(member!.pendingDeposit)
            : toNano(0);
    }

    if (params?.action === 'withdraw_ready') {
        balance = member?.withdraw || toNano(0);
    }

    const onSetAmount = useCallback((newAmount: string) => {
        setMinAmountWarn(undefined);
        setAmount(newAmount);
    }, []);

    const doContinue = useCallback(async () => {
        let value: BN;
        let minAmount = pool?.params.minStake
            ? pool.params.minStake
                .add(pool.params.receiptPrice)
                .add(pool.params.depositFee)
            : toNano(AppConfig.isTestnet ? '10.2' : '50');

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
        if (
            (params?.action === 'deposit' || params?.action === 'top_up')
            && value.lt(minAmount)
        ) {
            setMinAmountWarn(
                t('products.staking.minAmountWarning',
                    { minAmount: fromNano(minAmount) })
            );
            return;
        }

        // Check availible 
        if (params?.action === 'withdraw') {
            const availible = member
                ? member.balance.add(member.withdraw).add(member.pendingDeposit)
                : undefined;
            if (!availible || availible.lt(value)) {
                setMinAmountWarn(t('products.staking.transfer.notEnoughStaked'));
                return;
            }
        }

        // Add withdraw payload
        let payload: Cell;
        let transferAmount = value;
        if (params.action === 'withdraw_ready') {
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool ? pool.params.withdrawFee.add(pool.params.receiptPrice) : toNano('0.2');
        } else if (params?.action === 'withdraw') {
            if (transferAmount.eq(balance)) transferAmount = new BN(0);
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool ? pool.params.withdrawFee.add(pool.params.receiptPrice) : toNano('0.2');
        } else if (params.action === 'deposit' || params.action === 'top_up') {
            payload = createAddStakeCommand();
        } else {
            throw Error('Invalid action');
        }

        // Check amount
        if ((transferAmount.eq(account?.balance ?? new BN(0)) || account?.balance.lt(transferAmount))) {
            setMinAmountWarn(
                (params.action === 'withdraw' || params.action === 'withdraw_ready')
                    ? t('products.staking.transfer.notEnoughCoinsFee', { amount: pool ? fromNano(pool.params.withdrawFee.add(pool.params.receiptPrice)) : '0.2' })
                    : t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (transferAmount.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        if (isLedger) {
            let actionText = t('transfer.title');
            if (params.action === 'withdraw') {
                actionText = t('products.staking.transfer.withdrawStakeTitle');
            } else if (params.action === 'top_up') {
                actionText = t('products.staking.transfer.topUpTitle');
            } else if (params.action === 'withdraw_ready') {
                actionText = t('products.staking.transfer.confirmWithdrawReady');
            }

            const text = t('products.staking.transfer.ledgerSignText', { action: actionText });
            navigation.navigateLedgerSignTransfer({
                order: {
                    target: params.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                    payload: { type: 'unsafe', message: new CellMessage(payload) },
                    amount: transferAmount,
                    amountAll: false,
                    stateInit: null,
                },
                text: text,
            });
            return;
        }

        // Navigate to TransferFragment
        navigation.navigateTransfer({
            order: {
                messages: [{
                    target: params.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                    payload,
                    amount: transferAmount,
                    amountAll: false,
                    stateInit: null,
                }]
            },
            text: null,
            job: null,
            callback: null
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
            setAmount('');
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, [amount]);

    const onAddAll = useCallback(() => {
        let addAmount = balance;
        if (params?.action === 'deposit' || params?.action === 'top_up') {
            // Account for withdraw fee need to unstake 
            addAmount = addAmount
                .sub(pool?.params.withdrawFee || toNano('0.1'))
                .sub(pool?.params.receiptPrice || toNano('0.1'))
                .sub(pool?.params.withdrawFee || toNano('0.1')) // saving up for the potential second 'withdraw' request
                .sub(pool?.params.receiptPrice || toNano('0.1'))
        }
        onSetAmount(fromNano(addAmount));
    }, [balance, params, pool]);

    useEffect(() => {
        setTitle(actionTitle(params?.action));
    }, [params?.action]);

    useLayoutEffect(() => {
        setTimeout(() => refs[0]?.current?.focus(), 100);
    }, []);

    const withdrawFee = pool ? pool.params.withdrawFee.add(pool.params.receiptPrice) : toNano('0.2');

    const priceText = useMemo(() => {
        if (!validAmount) {
            return;
        }
        return formatCurrency(
            (parseFloat(fromNano(validAmount.abs())) * (price ? price?.price.usd * price.price.rates[currency] : 0)).toFixed(2),
            currency,
            validAmount.isNeg()
        );
    }, [validAmount, price, currency]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Platform.OS === 'ios' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.background }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={title}
                onClosePressed={navigation.goBack}
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
                            backgroundColor: Theme.surfaceSecondary,
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
                                />
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
                                color: minAmountWarn ? Theme.accentRed : Theme.textPrimary,
                                width: 'auto',
                                flexShrink: 1
                            }}
                            suffux={priceText}
                            hideClearButton
                            prefix={'TON'}
                        />
                    </View>
                    {!!minAmountWarn && (
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
                                {minAmountWarn}
                            </Text>
                        </Animated.View>
                    )}

                    {(params?.action === 'deposit' || params?.action === 'top_up') && pool && (
                        <>
                            <StakingCalcComponent
                                amount={amount}
                                topUp={params?.action === 'top_up'}
                                member={member}
                                pool={pool}
                            />
                            <PoolTransactionInfo pool={pool} />
                        </>
                    )}
                    {(params?.action === 'withdraw' || params?.action === 'withdraw_ready') && (
                        <>
                            <View style={{
                                backgroundColor: Theme.border,
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
                                        color: Theme.textSecondary
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
                                            color: Theme.textPrimary
                                        }}>
                                            {`${fromNano(withdrawFee)} TON`}
                                        </Text>
                                        <PriceComponent
                                            amount={withdrawFee}
                                            style={{
                                                backgroundColor: Theme.transparent,
                                                paddingHorizontal: 0, paddingVertical: 0,
                                                alignSelf: 'flex-end',
                                                height: 'auto'
                                            }}
                                            textStyle={{ color: Theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                                        />
                                    </View>
                                </View>
                            </View>
                            {!!pool && params.action !== 'withdraw_ready' && (
                                <StakingCycle
                                    stakeUntil={pool.params.stakeUntil}
                                    locked={pool.params.locked}
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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <RoundButton
                    title={t('common.continue')}
                    action={doContinue}
                />
            </KeyboardAvoidingView>
            {/* <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} /> */}
        </View>
    );
});