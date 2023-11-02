import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, fromNano, toNano } from '@ton/core';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { createWithdrawStakeCell } from '../../utils/createWithdrawStakeCommand';
import { parseAmountToBn, parseAmountToNumber, parseAmountToValidBN } from '../../utils/parseAmount';
import { ValueComponent } from '../../components/ValueComponent';
import { createAddStakeCommand } from '../../utils/createAddStakeCommand';
import { useParams } from '../../utils/useParams';
import { useStakingPool } from '../../engine/hooks/staking/useStakingPool';
import { useAccountLite } from '../../engine/hooks/accounts/useAccountLite';
import { useNetwork } from '../../engine/hooks/network/useNetwork';
import { useTheme } from '../../engine/hooks/theme/useTheme';
import { useSelectedAccount } from '../../engine/hooks/appstate/useSelectedAccount';
import { PoolTransactionInfo } from '../../components/staking/PoolTransactionInfo';
import { UnstakeBanner } from '../../components/staking/UnstakeBanner';
import { StakingCalcComponent } from '../../components/staking/StakingCalcComponent';
import { StakingCycle } from '../../components/staking/StakingCycle';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    fontSize: 17
};

export type ATextInputRef = {
    focus: () => void;
    blur: () => void;
}

export type TransferAction = 'deposit' | 'withdraw' | 'top_up' | 'withdraw_ready';

export type StakingTransferParams = {
    target?: Address,
    amount?: bigint | null,
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
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const params = useParams<StakingTransferParams>();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected!.address);
    const safeArea = useSafeAreaInsets();
    const pool = useStakingPool(params.target!);
    const member = pool?.member

    const [title, setTitle] = React.useState('');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '');
    const [minAmountWarn, setMinAmountWarn] = React.useState<string>();

    let balance = account!.balance || BigInt(0);
    if (params?.action === 'withdraw') {
        balance = member
            ? member!.balance + member!.withdraw + member!.pendingDeposit
            : toNano(0);
    }

    if (params?.action === 'withdraw_ready') {
        balance = member?.withdraw || toNano(0);
    }

    const onSetAmount = React.useCallback(
        (newAmount: string) => {
            setMinAmountWarn(undefined);
            setAmount(newAmount);
        }, []);

    const doContinue = React.useCallback(async () => {
        let value: bigint;
        let minAmount = pool?.params.minStake
            ? pool.params.minStake + pool.params.receiptPrice + pool.params.depositFee
            : toNano(isTestnet ? '10.2' : '50');

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
            && value < minAmount
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
                ? member.balance + member.withdraw + member.pendingDeposit
                : undefined;
            if (!availible || availible < value) {
                setMinAmountWarn(t('products.staking.transfer.notEnoughStaked'));
                return;
            }
        }

        // Add withdraw payload
        let payload: Cell;
        let transferAmount = value;
        if (params.action === 'withdraw_ready') {
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool ? pool.params.withdrawFee + pool.params.receiptPrice : toNano('0.2');
        } else if (params?.action === 'withdraw') {
            if (transferAmount === balance) transferAmount = BigInt(0);
            payload = createWithdrawStakeCell(transferAmount);
            transferAmount = pool ? pool.params.withdrawFee + pool.params.receiptPrice : toNano('0.2');
        } else if (params.action === 'deposit' || params.action === 'top_up') {
            payload = createAddStakeCommand();
        } else {
            throw Error('Invalid action');
        }

        // Check amount
        if ((transferAmount === account!.balance || account!.balance < transferAmount)) {
            setMinAmountWarn(
                (params.action === 'withdraw' || params.action === 'withdraw_ready')
                    ? t('products.staking.transfer.notEnoughCoinsFee', { amount: pool ? fromNano(pool.params.withdrawFee + pool.params.receiptPrice) : '0.2' })
                    : t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (transferAmount === BigInt(0)) {
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
                messages: [{
                    target: params.target.toString({ testOnly: isTestnet }),
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

    const scrollToInput = React.useCallback((index: number) => {
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
    React.useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = React.useCallback((index: number) => {
        if (amount === '0') {
            setAmount('');
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, [amount]);

    const onAddAll = React.useCallback(() => {
        let addAmount = balance;
        if (params?.action === 'deposit' || params?.action === 'top_up') {
            // Account for withdraw fee need to unstake 
            addAmount = addAmount
                - (pool?.params.withdrawFee || toNano('0.1'))
                - (pool?.params.receiptPrice || toNano('0.1'))
                - (pool?.params.withdrawFee || toNano('0.1')) // saving up for the potential second 'withdraw' request
                - (pool?.params.receiptPrice || toNano('0.1'))
        }
        onSetAmount(fromNano(addAmount));
    }, [balance, params, pool]);

    React.useEffect(() => {
        setTitle(actionTitle(params?.action));
    }, [params?.action]);

    React.useLayoutEffect(() => {
        setTimeout(() => refs[0]?.current?.focus(), 100);
    }, []);

    const withdrawFee = pool ? pool.params.withdrawFee + pool.params.receiptPrice : toNano('0.2');

    return (
        <>
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={title}
            />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17,
                }}>
                    <Text style={[labelStyle, { textAlign: 'center', lineHeight: 32 }]}>
                        {title}
                    </Text>
                </View>
            )}
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <>
                        <View style={{
                            marginBottom: 0,
                            backgroundColor: theme.item,
                            borderRadius: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 15,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                width: '100%',
                                justifyContent: 'space-between'
                            }}>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    color: theme.textSubtitle,
                                }}>
                                    {t('common.amount')}
                                </Text>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    color: theme.priceSecondary,
                                }}>
                                    <ValueComponent value={balance} precision={3} />
                                    {' TON'}
                                </Text>
                            </View>
                            <View style={{ width: '100%' }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <ATextInput
                                        index={0}
                                        ref={refs[0]}
                                        onFocus={onFocus}
                                        value={amount}
                                        onValueChange={onSetAmount}
                                        placeholder={'0'}
                                        keyboardType={'numeric'}
                                        textAlign={'left'}
                                        style={{ paddingHorizontal: 0, backgroundColor: theme.transparent, marginTop: 4, flexShrink: 1 }}
                                        inputStyle={{ color: theme.accent, flexGrow: 1, paddingTop: 0 }}
                                        fontWeight={'800'}
                                        fontSize={30}
                                        editable={!params?.lockAmount}
                                        enabled={!params?.lockAmount}
                                        preventDefaultHeight
                                        preventDefaultLineHeight
                                        preventDefaultValuePadding
                                        blurOnSubmit={false}
                                    />
                                    {!params?.lockAmount && <Pressable
                                        style={({ pressed }) => {
                                            return [
                                                {
                                                    backgroundColor: theme.accent,
                                                    height: 24,
                                                    borderRadius: 40,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 3,
                                                },
                                                { opacity: pressed ? 0.3 : 1 }
                                            ]
                                        }}
                                        onPress={onAddAll}
                                    >
                                        <Text style={{
                                            fontWeight: '600',
                                            fontSize: 16,
                                            color: theme.item
                                        }}>
                                            {t('common.max')}
                                        </Text>
                                    </Pressable>}
                                </View>
                                <PriceComponent
                                    amount={parseAmountToValidBN(amount)}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0
                                    }}
                                    textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
                                />
                            </View>
                        </View>
                        {!!minAmountWarn && (
                            <Text style={{
                                color: theme.dangerZone,
                                fontWeight: '400',
                                fontSize: 14,
                                marginTop: 10
                            }}>
                                {minAmountWarn}
                            </Text>
                        )}
                        {(params?.action === 'deposit' || params?.action === 'top_up') && pool && (
                            <>
                                {!isTestnet && (
                                    <StakingCalcComponent
                                        amount={amount}
                                        topUp={params?.action === 'top_up'}
                                        pool={pool}
                                    />
                                )}
                                <PoolTransactionInfo pool={pool} />
                            </>
                        )}
                        {(params?.action === 'withdraw' || params?.action === 'withdraw_ready') && (
                            <>
                                <View style={{
                                    backgroundColor: theme.item,
                                    borderRadius: 14,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingLeft: 16,
                                    marginTop: 14,
                                    marginBottom: 15
                                }}>
                                    <View style={{
                                        flexDirection: 'row', width: '100%',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        paddingRight: 16,
                                        height: 55
                                    }}>
                                        <Text style={{
                                            fontSize: 16,
                                            color: theme.label
                                        }}>
                                            {t('products.staking.info.withdrawFee')}
                                        </Text>
                                        <View style={{ justifyContent: 'center' }}>
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 16,
                                                color: theme.textColor
                                            }}>
                                                {`${fromNano(withdrawFee)} TON`}
                                            </Text>
                                            <PriceComponent
                                                amount={withdrawFee}
                                                style={{
                                                    backgroundColor: theme.transparent,
                                                    paddingHorizontal: 0, paddingVertical: 2,
                                                    alignSelf: 'flex-end'
                                                }}
                                                textStyle={{ color: theme.priceSecondary, fontWeight: '400' }}
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
                                {!!member && params.action !== 'withdraw_ready' && parseAmountToNumber(amount) > 0 && (
                                    <UnstakeBanner amount={amount} member={member} />
                                )}
                            </>
                        )}
                    </>
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