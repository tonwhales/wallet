import { useState, useCallback, useEffect, useMemo } from "react";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { CoinItem } from "../../components/products/savings/CoinItem";
import { getChainNameByChain, getChainShortNameByChain, getCoinInfoByCurrency, getKnownCurrencyFromName } from "../../engine/utils/chain";
import { Typography } from "../../components/styles";
import { RoundButton } from "../../components/RoundButton";
import { humanizeNumber } from "../../utils/holders/humanize";
import { formatInputAmount } from "../../utils/formatCurrency";
import { parseAmountToNumber } from "../../utils/parseAmount";
import { OrderInfoLine } from "../../components/orders/OrderInfoLine";
import { useCreateChangellyTransaction } from "../../engine/hooks/changelly/useCreateChangellyTransaction";
import { Currency } from "../../engine/types/deposit";
import { ChangellyCurrency } from "../../engine/api/changelly";
import { useParams } from "../../utils/useParams";
import { useChangellyEstimate } from "../../engine/hooks/changelly/useChangellyEstimate";
import { debounce } from "../../utils/debounce";
import { useKeyboard } from "@react-native-community/hooks";

import ExchangeRateIcon from '@assets/order/exchange-rate.svg';
import NetworkFeeIcon from '@assets/order/network-fee.svg';
import ChangellyLogo from '@assets/changelly-big.svg';

const INITIAL_MAX_VALUE = 1000000;
const MAX_DECIMALS = 6;

export type ChangellyCalculationFragmentParams = {
    currencyTo: Currency;
    currencyFrom: ChangellyCurrency;
}

export const ChangellyCalculationFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const keyboard = useKeyboard()
    const [amount, setAmount] = useState('');
    const [previousAmount, setPreviousAmount] = useState('');
    const [maxValue, setMaxValue] = useState(INITIAL_MAX_VALUE);
    const { currencyTo, currencyFrom } = useParams<ChangellyCalculationFragmentParams>();
    const { mutate: createChangellyTransaction, data: changellyTransaction, isSuccess: isTransactionCreated, isLoading: isCreatingTransaction } = useCreateChangellyTransaction();
    const { mutate: estimate, data: estimation, isLoading: isFetchingEstimate } = useChangellyEstimate();
    const estimateDebounced = useMemo(() => debounce(estimate, 500), []);
    const { blockchain: blockchainTo, name: nameTo } = getCoinInfoByCurrency(currencyTo);
    
    const originBlockchain = currencyFrom.blockchain;
    const originBlockchainTag = getChainShortNameByChain(originBlockchain);
    const originKnownCurrency = getKnownCurrencyFromName(currencyFrom.name);
    const originCoinName = originKnownCurrency ? getCoinInfoByCurrency(originKnownCurrency).name : currencyFrom.name;
    const originTicker = currencyFrom.ticker;
    const originImage = currencyFrom.image;
    
    const exchangeRateDisplayValue = estimation?.rate ? `1 ${originCoinName} (${originBlockchainTag}) = ${humanizeNumber(estimation?.rate ?? '1', 0, 6, 4)} ${nameTo} (${getChainShortNameByChain(blockchainTo)})` : '';
    const networkFeeDisplayValue = estimation?.networkFee ? `${humanizeNumber(estimation?.networkFee ?? 0)}%` : '';
    const isContinueButtonDisabled = isCreatingTransaction || !estimation?.amountTo;
    
    useEffect(() => {
        if (estimation?.maxFrom) {
            setMaxValue(parseAmountToNumber(formatInputAmount(estimation.maxFrom, MAX_DECIMALS)));
        }
    }, [estimation]);
    
    useEffect(() => {
        if (isTransactionCreated && changellyTransaction) {
            navigation.popToTop();
            navigation.navigateChangellyOrder({ changellyTransaction, isAfterCreation: true });
        }
    }, [isTransactionCreated, changellyTransaction]);
    
    const contentInset = useMemo(() => {
        return {
            bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - 32 : 0
        }
    }, [keyboard.keyboardShown, keyboard.keyboardHeight])

    const formatAmountInput = useCallback((value: string, previousValue?: string) => {
        // Additional logic to remove leading zeros before digits
        let formatted = value.replace(/^0+([1-9])/, '$1');

        const numericValue = parseAmountToNumber(formatted);
        if (numericValue > maxValue) {
            formatted = formatInputAmount(maxValue.toString(), MAX_DECIMALS);
        }
        formatted = formatInputAmount(formatted, MAX_DECIMALS, {}, previousValue);

        return formatted;
    }, [maxValue]);

    const handleAmountChange = useCallback((value: string) => {
        const formatted = formatAmountInput(value, previousAmount);
        setPreviousAmount(amount);
        setAmount(formatted);

        if (formatted !== '' && formatted !== '0') {
            estimateDebounced({ toCurrency: currencyTo, fromCurrency: originTicker, amount: parseAmountToNumber(formatted).toString() });
        }
    }, [amount, previousAmount, formatAmountInput]);

    const onContinue = useCallback(() => {
        if (!!originBlockchain) {
            createChangellyTransaction({
                fromCurrency: originTicker,
                toCurrency: currencyTo,
                network: originBlockchain,
                amount: parseAmountToNumber(amount).toString(),
            })
        }
    }, [amount, originBlockchain, originTicker, currencyTo, createChangellyTransaction]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('order.enterAmount')}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 8 }}
                contentInset={contentInset}
            >
                <View style={{ backgroundColor: theme.surfaceOnElevation, borderRadius: 20, paddingVertical: 16 }}>
                    <Text style={[Typography.medium15_20, { color: theme.textSecondary, paddingHorizontal: 16 }]}>
                        {t('order.give')}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 20 }}>
                        <CoinItem
                            theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                            name={originCoinName}
                            blockchain={originBlockchain}
                            imageUrl={originImage}
                            tag={originBlockchainTag}
                            description={t('products.holders.accounts.network', { networkName: originBlockchainTag })}
                            isPressable={false}
                            currency={originKnownCurrency}
                        />
                        <TextInput
                            value={amount}
                            onChangeText={handleAmountChange}
                            style={[Typography.semiBold17_24, { color: theme.textPrimary, textAlign: 'right', minWidth: 80 }]}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={theme.textPrimary}
                        />
                    </View>
                </View>
                <View style={{ backgroundColor: theme.surfaceOnElevation, borderRadius: 20, paddingVertical: 16 }}>
                    <Text style={[Typography.medium15_20, { color: theme.textSecondary, paddingHorizontal: 16 }]}>
                        {t('order.get')}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 20 }}>
                        <CoinItem
                            theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                            currency={currencyTo}
                            name={nameTo}
                            blockchain={blockchainTo}
                            tag={getChainShortNameByChain(blockchainTo)}
                            description={t('products.holders.accounts.network', { networkName: getChainNameByChain(blockchainTo) })}
                            isPressable={false}
                        />
                        <TextInput
                            value={estimation?.visibleAmount ?? '0'}
                            style={[Typography.semiBold17_24, { color: theme.textPrimary, textAlign: 'right', minWidth: 80 }]}
                            editable={false}
                        />
                    </View>
                </View>
                <View style={{ gap: 12, marginTop: 8 }}>
                    <OrderInfoLine
                        icon={ExchangeRateIcon}
                        label={t('order.exchangeRate')}
                        value={exchangeRateDisplayValue}
                        isLoading={isFetchingEstimate}
                    />
                    <OrderInfoLine
                        icon={NetworkFeeIcon}
                        label={t('order.networkServiceFee')}
                        value={networkFeeDisplayValue}
                        isLoading={isFetchingEstimate}
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                        {t('order.poweredBy')}
                    </Text>
                    <ChangellyLogo width={88} height={20} color={theme.textSecondary} />
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[
                    { marginHorizontal: 16, marginTop: 16, },
                    Platform.select({
                        android: { marginBottom: safeArea.bottom + 16 },
                        ios: { marginBottom: safeArea.bottom + 16 }
                    })
                ]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 16 : 0}
            >
                <RoundButton
                    title={t('order.continue')}
                    onPress={onContinue}
                    disabled={isContinueButtonDisabled}
                    loading={isCreatingTransaction}
                />
            </KeyboardAvoidingView>
        </View>
    );
});