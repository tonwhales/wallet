import { useKeyboard } from "@react-native-community/hooks";
import React, { useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../components/ATextInput";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { formatCurrency, formatInputAmount } from "../../utils/formatCurrency";
import { ValueComponent } from "../../components/ValueComponent";
import { TransferAction } from "./StakingTransferFragment";
import { useNetwork, usePrice, useSelectedAccount, useStakingPool, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { Address, fromNano, toNano } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StakingCalcComponent } from "../../components/staking/StakingCalcComponent";
import { StatusBar } from "expo-status-bar";

export const StakingCalculatorFragment = fragment(() => {
    const theme = useTheme();
    const params = useParams<{ target: Address }>();
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const [price, currency] = usePrice();
    const ledgerContext = useLedgerTransport();
    const route = useRoute();
    const network = useNetwork();
    const selected = useSelectedAccount();

    const isLedger = route.name === 'LedgerStakingCalculator';

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const config = useStakingWalletConfig(
        isLedger
            ? ledgerAddress!.toString({ testOnly: network.isTestnet })
            : selected!.address.toString({ testOnly: network.isTestnet })
    );

    const available = useMemo(() => {
        if (network.isTestnet) {
            return true;
        }
        return !!config?.pools.find((v2) => {
            return Address.parse(v2).equals(params.target)
        })
    }, [config, params.target, network]);

    const pool = useStakingPool(params.target, ledgerAddress);

    const [amount, setAmount] = useState(pool?.member?.balance ? fromNano(pool.member.balance) : '');

    const validAmount = useMemo(() => {
        let value: bigint | null = null;
        if (amount.length === 0) {
            return 0n;
        }
        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            value = toNano(valid);
            return value;
        } catch {
            return null;
        }
    }, [amount]);

    const priceText = useMemo(() => {
        if (!amount || !validAmount) {
            return;
        }

        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(validAmount)) * (price ? price?.price.usd * price.price.rates[currency] : 0)).toFixed(2),
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
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20,
                                color: theme.textSecondary,
                            }}>
                                {`${t('common.balance')}: `}
                                <ValueComponent
                                    precision={4}
                                    value={pool?.member?.balance || 0n}
                                    centFontStyle={{ opacity: 0.5 }}
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
                            prefix={'TON'}
                        />
                    </View>
                    {!!pool && validAmount !== null && (
                        <StakingCalcComponent
                            amount={validAmount}
                            pool={pool}
                        />
                    )}
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <RoundButton
                    title={t('products.staking.calc.goToTopUp')}
                    disabled={!available}
                    onPress={() => {
                        navigation.replace(
                            isLedger ? 'LedgerStakingTransfer' : 'StakingTransfer',
                            {
                                target: params.target,
                                amount:
                                    (pool?.params.minStake ?? 0n)
                                    + (pool?.params?.receiptPrice ?? 0n)
                                    + (pool?.params?.depositFee ?? 0n)
                                    + (validAmount ?? 0n),
                                lockAddress: true,
                                lockComment: true,
                                action: 'top_up' as TransferAction,
                            }
                        )
                    }}
                />
            </KeyboardAvoidingView>
        </>

    );
});