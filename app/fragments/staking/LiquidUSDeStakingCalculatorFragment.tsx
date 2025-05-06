import { useKeyboard } from "@react-native-community/hooks";
import React, { memo, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../components/ATextInput";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { formatCurrency, formatInputAmount } from "../../utils/formatCurrency";
import { ValueComponent } from "../../components/ValueComponent";
import { useIsLedgerRoute, useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, usePrice, useSelectedAccount, useTheme, useUSDeStakingApy } from "../../engine/hooks";
import { Address, fromNano, toNano } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { useValidAmount } from "../../utils/useValidAmount";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { Typography } from "../../components/styles";
import { PriceComponent } from "../../components/PriceComponent";

const CalcComponent = memo(({ amount }: { amount: bigint }) => {
    const usdeApy = (useUSDeStakingApy()?.apy ?? 1) / 100;
    const theme = useTheme();
    const amountNum = Number(fromNano(amount));
    console.log('amountNum', amountNum, usdeApy);
    const yearly = amountNum * usdeApy;
    const monthly = amountNum * (Math.pow((1 + usdeApy / 366), 30)) - amountNum;
    const daily = amountNum * (1 + usdeApy / 366) - amountNum;

    return (
        <View style={{
            backgroundColor: theme.surfaceOnElevation,
            padding: 20,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('products.staking.calc.yearly')}
                </Text>
                <View>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        {'≈ '}
                        <ValueComponent precision={monthly < 0.01 ? 8 : 2} value={toNano(yearly.toFixed(3))} />
                        {' USDe'}
                    </Text>
                    <PriceComponent
                        amount={toNano(yearly.toFixed(3))}
                        style={[{ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }]}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={1}
                    />
                </View>
            </View>
            <View style={{
                height: 1, width: '100%',
                backgroundColor: theme.divider,
                marginVertical: 16
            }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('products.staking.calc.monthly')}
                </Text>
                <View>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        {'≈ '}
                        <ValueComponent precision={monthly < 0.01 ? 8 : 2} value={toNano(monthly.toFixed(3))} />
                        {' USDe'}
                    </Text>
                    <PriceComponent
                        amount={toNano(monthly.toFixed(3))}
                        style={[{ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }]}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={1}
                    />
                </View>
            </View>
            <View style={{
                height: 1, width: '100%',
                backgroundColor: theme.divider,
                marginVertical: 16
            }} />
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('products.staking.calc.daily')}
                </Text>
                <View>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        {'≈ '}
                        <ValueComponent precision={daily < 0.01 ? 8 : 2} value={toNano(daily.toFixed(3))} />
                        {' USDe'}
                    </Text>
                    <PriceComponent
                        amount={toNano(daily.toFixed(3))}
                        style={[{ backgroundColor: theme.transparent, paddingHorizontal: 0, paddingVertical: 0, height: 'auto', alignSelf: 'flex-end' }]}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={1}
                    />
                </View>
            </View>
            <View style={{
                borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: theme.backgroundPrimary,
                width: '100%',
                justifyContent: 'center', alignItems: 'center',
                marginTop: 16
            }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('products.staking.calc.note')}
                </Text>
            </View>
        </View>
    );
})

export const LiquidUSDeStakingCalculatorFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const [price, currency] = usePrice();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const isLedger = useIsLedgerRoute();
    const rate = useLiquidUSDeStakingRate();

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const account = isLedger ? ledgerAddress : selected?.address;
    const nominator = useLiquidUSDeStakingMember(account);

    const tsUSDe = nominator?.balance || 0n;
    const inUsde = tsUSDe * rate;

    let initialAmount = inUsde ? fromBnWithDecimals(inUsde, 6) : '';
    if (initialAmount) {
        const parts = initialAmount.split('.');
        if (parts.length > 1) {
            initialAmount = `${parts[0]}.${parts[1].slice(0, 2)}`;
        }
    }

    const [amount, setAmount] = useState(initialAmount);
    const validAmount = useValidAmount(amount);

    const priceText = useMemo(() => {
        if (!amount || !validAmount) {
            return;
        }

        const isNeg = validAmount < 0n;

        return formatCurrency(
            (parseFloat(fromNano(validAmount)) * (price ? price.price.rates[currency] : 0)).toFixed(2),
            currency,
            isNeg
        );
    }, [amount, price, currency, validAmount]);

    return (
        <>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('products.staking.calc.text')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                automaticallyAdjustContentInsets={false}
                scrollEventThrottle={16}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    <View
                        style={{
                            marginVertical: 16,
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
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {`${t('common.balance')}: `}
                                <ValueComponent
                                    precision={4}
                                    value={inUsde}
                                    centFontStyle={{ opacity: 0.5 }}
                                    decimals={6}
                                />
                            </Text>
                        </View>
                        <ATextInput
                            index={0}
                            value={amount}
                            onValueChange={(newVal) => {
                                const formatted = formatInputAmount(newVal, 9, { skipFormattingDecimals: true }, amount);
                                const temp = formatted.replace(',', '.').replaceAll(' ', '');

                                if (temp.split('.')[0].length > 10) { // 10 digits before dot bigger is unreallistic
                                    return;
                                }
                                setAmount(formatted);
                            }}
                            autoFocus
                            keyboardType={'numeric'}
                            style={{
                                backgroundColor: theme.backgroundPrimary,
                                paddingHorizontal: 16, paddingVertical: 14,
                                borderRadius: 16,
                            }}
                            inputStyle={{
                                fontSize: 17, fontWeight: '400',
                                color: theme.textPrimary,
                                width: 'auto',
                                flexShrink: 1
                            }}
                            suffix={priceText}
                            hideClearButton
                            inputSuffix={'USDe'}
                        />
                    </View>
                    {(validAmount !== null) && (
                        <CalcComponent amount={validAmount} />
                    )}
                </View>
            </ScrollView>
        </>
    );
});