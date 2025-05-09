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
import { ValueComponent } from '../../components/ValueComponent';
import { useParams } from '../../utils/useParams';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { Address, toNano } from '@ton/core';
import { useIsLedgerRoute, useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useNetwork, usePrice, useSelectedAccount, useTheme, useUSDeAssetsShares } from '../../engine/hooks';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { StatusBar } from 'expo-status-bar';
import { ItemDivider } from '../../components/ItemDivider';
import { Typography } from '../../components/styles';
import { Image } from "expo-image";
import { AppsFlyerEvent } from '../../analytics/appsflyer';
import { trackAppsFlyerEvent } from '../../analytics/appsflyer';
import { fromBnWithDecimals, toBnWithDecimals } from '../../utils/withDecimals';
import { liquidUSDeAmountReducer, reduceLiquidUSDeAmount } from '../../utils/staking/liquidUSDeAmountReducer';
import { createUnstakeLiquidUSDeStakingPayload } from '../../utils/staking/liquidUSDeStaking';
import { createDespositLiquidUSDeStakingPayload } from '../../utils/staking/liquidUSDeStaking';

type TransferAction = 'deposit' | 'unstake';

export function actionTitle(action?: TransferAction) {
    switch (action) {
        case 'unstake':
            return t('products.staking.transfer.withdrawStakeTitle');
        case 'deposit':
            return t('products.staking.transfer.topUpTitle');
        default:
            return t('products.staking.title')
    }
}

export type LiquidUSDeStakingTransferParams = {
    amount?: string | null,
    action?: TransferAction
};

export const LiquidUSDeStakingTransferFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const { amount: initialAmountString, action } = useParams<LiquidUSDeStakingTransferParams>();
    const selected = useSelectedAccount();
    const isLedger = useIsLedgerRoute();
    const [, currency] = usePrice();

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const memberAddress = isLedger ? ledgerAddress : selected?.address;
    const member = useLiquidUSDeStakingMember(memberAddress);
    const rate = useLiquidUSDeStakingRate();
    const usdeShares = useUSDeAssetsShares(memberAddress);

    const descriptionSend = action === 'deposit'
        ? usdeShares?.usdeHint?.jetton.name
        : usdeShares?.tsUsdeHint?.jetton.name;

    const descriptionReceive = action === 'deposit'
        ? usdeShares?.tsUsdeHint?.jetton.name
        : usdeShares?.usdeHint?.jetton.name;

    const usdeAddressWallet = useMemo(() => {
        if (!usdeShares) {
            return;
        }
        return usdeShares.usdeHint?.walletAddress;
    }, [usdeShares]);

    const tsUsdeAddressWallet = useMemo(() => {
        if (!usdeShares) {
            return;
        }
        return usdeShares.tsUsdeHint?.walletAddress;
    }, [usdeShares]);

    const { balance, decimals } = useMemo(() => {
        if (action === 'deposit') {
            return {
                balance: BigInt(usdeShares?.usdeHint?.balance ?? 0n),
                decimals: usdeShares?.usdeHint?.jetton.decimals ?? 6
            };
        }
        if (action === 'unstake') {
            return {
                balance: BigInt(usdeShares?.tsUsdeHint?.balance ?? 0n),
                decimals: usdeShares?.tsUsdeHint?.jetton.decimals ?? 6
            };
        }
        return { balance: 0n, decimals: 6 };
    }, [action, member, usdeShares]);

    const rateNumber = useMemo(() => {
        try {
            return Number(rate);
        } catch (error) {
            return 0;
        }
    }, [rate]);

    const [amount, dispatchAmount] = useReducer(
        liquidUSDeAmountReducer(rateNumber),
        reduceLiquidUSDeAmount(
            { usde: '', tsUsde: '' },
            action === 'deposit'
                ? { type: 'usde', amount: initialAmountString ?? '' }
                : { type: 'tsUsde', amount: initialAmountString ?? '' },
            rateNumber
        )
    );

    const validAmount = useMemo(() => {
        const amountString = action === 'deposit'
            ? amount.usde
            : amount.tsUsde;
        if (amountString.length === 0) {
            return 0n;
        }
        let value: bigint | null = null;
        try {
            const valid = amountString.replace(',', '.').replaceAll(' ', '');
            value = toBnWithDecimals(valid, decimals);
            return value;
        } catch {
            return null;
        }
    }, [action, amount, decimals]);

    const priceText = useMemo(() => {
        if (!validAmount) {
            return;
        }
        const isNeg = validAmount < 0n;
        let abs = isNeg
            ? -validAmount
            : validAmount;
        const absNumber = Number(fromBnWithDecimals(abs.toString(), decimals));
        const computed = action === 'deposit'
            ? absNumber
            : absNumber * rate;

        return formatCurrency(
            computed.toFixed(2),
            currency,
            isNeg
        );
    }, [validAmount, action, rate, decimals]);

    const doContinue = useCallback(async () => {
        if (!memberAddress) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }
        if (!validAmount) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        const target = action === 'deposit'
            ? usdeAddressWallet?.address
            : tsUsdeAddressWallet?.address;

        const transferCell = action === 'deposit'
            ? createDespositLiquidUSDeStakingPayload({
                owner: memberAddress,
                amount: validAmount,
                isTestnet
            })
            : createUnstakeLiquidUSDeStakingPayload({
                owner: memberAddress,
                amount: validAmount,
                isTestnet
            });

        const transferAmountTon = toNano('0.2');

        if (!target) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        // Ledger transfer
        if (isLedger) {
            let actionText = t('transfer.title');

            if (action === 'unstake') {
                actionText = t('products.staking.transfer.withdrawStakeTitle');
            } else if (action === 'deposit') {
                actionText = t('products.staking.transfer.topUpTitle');
            }

            const text = t('products.staking.transfer.ledgerSignText', { action: actionText });
            navigation.navigateLedgerSignTransfer({
                order: {
                    type: 'ledger',
                    target,
                    payload: {
                        type: 'unsafe',
                        message: transferCell
                    },
                    amount: transferAmountTon,
                    amountAll: false,
                    stateInit: null
                },
                text: text,
                callback: (ok: boolean) => {
                    if (ok) {
                        trackAppsFlyerEvent(AppsFlyerEvent.StakingDeposit, {
                            af_currency: 'TON',
                            af_quantity: transferAmountTon.toString()
                        });
                    }
                }
            });
            return;
        }

        if (validAmount === 0n) {
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
                    payload: transferCell,
                    amount: transferAmountTon,
                    amountAll: false,
                    stateInit: null
                }]
            },
            text: null
        });
    }, [amount, member, balance, isTestnet, isLedger, ledgerContext, usdeShares, validAmount, usdeAddressWallet]);

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
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onAddAll = useCallback(() => {
        dispatchAmount({
            type: action === 'deposit' ? 'usde' : 'tsUsde',
            amount: fromBnWithDecimals(balance, decimals)
        });
    }, [balance, action, decimals]);

    useLayoutEffect(() => {
        setTimeout(() => refs[0]?.current?.focus(), 100);
    }, []);

    const amountError = useMemo(() => {
        if (validAmount === 0n) {
            return t('transfer.error.zeroCoins');
        }
        if (!validAmount) {
            return undefined;
        }

        const isDeposit = action === 'deposit';

        if (isDeposit && validAmount > balance) {
            return t('transfer.error.notEnoughJettons', { symbol: 'USDe' });
        }
        if (!isDeposit && validAmount > balance) {
            return t('transfer.error.notEnoughJettons', { symbol: 'tsUSDe' });
        }
        return undefined;
    }, [validAmount, balance, action]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={actionTitle(action)}
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
                    {action === 'unstake' ? (
                        <>
                            <View
                                style={{
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    padding: 20,
                                    overflow: 'hidden'
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
                                            source={require('@assets/tsUSDe.png')}
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
                                                {' tsUSDe'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                                {descriptionSend}
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
                                            decimals={decimals}
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
                                    value={amount.tsUsde}
                                    onValueChange={(value) => dispatchAmount({ type: 'tsUsde', amount: value })}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'tsUSDe'}
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
                                            source={require('@assets/usde.png')}
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
                                            style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                            ellipsizeMode="tail"
                                            numberOfLines={1}
                                        >
                                            <Text style={{ color: theme.textSecondary }}>
                                                {t('wallet.actions.receive')}
                                            </Text>
                                            {' USDe'}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        >
                                            {descriptionReceive}
                                        </Text>
                                    </View>
                                </View>
                                <ATextInput
                                    index={1}
                                    ref={refs[1]}
                                    onFocus={onFocus}
                                    value={amount.usde}
                                    onValueChange={(value) => dispatchAmount({ type: 'usde', amount: value })}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                        marginTop: 16
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'USDe'}
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
                                    padding: 20,
                                    overflow: 'hidden'
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                        <Image
                                            source={require('@assets/usde.png')}
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
                                            {' USDe'}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                                        >
                                            {descriptionSend}
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
                                            decimals={decimals}
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
                                    value={amount.usde}
                                    onValueChange={(value) => dispatchAmount({ type: 'usde', amount: value })}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'USDe'}
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
                                            source={require('@assets/tsUSDe.png')}
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
                                                {' tsUSDe'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                                {descriptionReceive}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <ATextInput
                                    index={1}
                                    ref={refs[1]}
                                    onFocus={onFocus}
                                    value={amount.tsUsde}
                                    onValueChange={(value) => dispatchAmount({ type: 'tsUsde', amount: value })}
                                    keyboardType={'numeric'}
                                    style={{
                                        backgroundColor: theme.backgroundPrimary,
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderRadius: 16,
                                        marginTop: 16
                                    }}
                                    inputStyle={[Typography.regular17_24, {
                                        lineHeight: undefined,
                                        color: theme.textPrimary,
                                        width: 'auto',
                                        flexShrink: 1
                                    }]}
                                    suffix={priceText}
                                    hideClearButton
                                    inputSuffix={'tsUSDe'}
                                />
                            </View>
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
                    disabled={!!amountError}
                    title={t('common.continue')}
                    action={doContinue}
                />
            </KeyboardAvoidingView>
        </View>
    );
});