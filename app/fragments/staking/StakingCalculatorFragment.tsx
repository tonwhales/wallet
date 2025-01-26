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
import { useLiquidStakingMember, useNetwork, usePrice, useSelectedAccount, useStakingPool, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { Address, fromNano, toNano } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StakingCalcComponent } from "../../components/staking/StakingCalcComponent";
import { StatusBar } from "expo-status-bar";
import { useLiquidStaking } from "../../engine/hooks/staking/useLiquidStaking";
import { getLiquidStakingAddress } from "../../utils/KnownPools";
import { useValidAmount } from "../../utils/useValidAmount";

export const StakingCalculatorFragment = fragment(() => {
    const theme = useTheme();
    const params = useParams<{ target: string }>();
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const [price, currency] = usePrice();
    const ledgerContext = useLedgerTransport();
    const route = useRoute();
    const network = useNetwork();
    const selected = useSelectedAccount();
    const liquidStaking = useLiquidStaking().data;

    const target = Address.parse(params.target);
    const isLiquid = target.equals(getLiquidStakingAddress(network.isTestnet));
    const isLedger = route.name === 'LedgerStakingCalculator';

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const account = isLedger ? ledgerAddress : selected?.address;

    const nominator = useLiquidStakingMember(account)?.data;

    const config = useStakingWalletConfig(account!.toString({ testOnly: network.isTestnet }));

    const available = useMemo(() => {
        if (network.isTestnet || isLiquid) {
            return true;
        }
        return !!config?.pools.find((v2) => {
            return Address.parse(v2).equals(target)
        })
    }, [config, target, network, isLiquid]);

    const pool = useStakingPool(target, ledgerAddress);

    const balance = useMemo(() => {
        if (!isLiquid) {
            return pool?.member?.balance ?? 0n;
        }
        const bal = fromNano(nominator?.balance || 0n);
        const rate = fromNano(liquidStaking?.rateWithdraw || 0n);
        return toNano((parseFloat(bal) * parseFloat(rate)).toFixed(9));
    }, [nominator?.balance, liquidStaking?.rateWithdraw, isLiquid]);

    let initialAmount = balance ? fromNano(balance) : '';
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
            (parseFloat(fromNano(validAmount)) * (price ? price?.price.usd * price.price.rates[currency] : 0)).toFixed(2),
            currency,
            isNeg
        );
    }, [amount, price, currency, validAmount]);

    const transferAmount = useMemo(() => {
        let poolParams = {
            minStake: pool?.params.minStake ?? 0n,
            receiptPrice: pool?.params.receiptPrice ?? 0n,
            depositFee: pool?.params.depositFee ?? 0n,
        };

        if (isLiquid) {
            poolParams = {
                minStake: liquidStaking?.extras.minStake ?? 0n,
                receiptPrice: liquidStaking?.extras.receiptPrice ?? 0n,
                depositFee: liquidStaking?.extras.depositFee ?? 0n,
            };
        }

        let value = 0n;

        if (!validAmount) {
            value += poolParams.minStake;
        } else if (validAmount < poolParams.minStake) {
            value += poolParams.minStake;
        } else {
            value += validAmount;
        }

        value += poolParams.receiptPrice;
        value += poolParams.depositFee;

        return value;

    }, [validAmount, pool?.params, liquidStaking?.extras]);

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
                                    value={balance}
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
                            inputSuffix={'TON'}
                        />
                    </View>
                    {(isLiquid ? !!liquidStaking : !!pool) && (validAmount !== null) && (
                        <StakingCalcComponent
                            poolAddressString={target.toString({ testOnly: network.isTestnet })}
                            amount={validAmount}
                            fee={isLiquid ? toNano(fromNano(liquidStaking!.extras.poolFee)) : pool!.params.poolFee}
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
                        if (isLiquid) {
                            navigation.navigateLiquidStakingTransfer(
                                {
                                    amount: transferAmount.toString(),
                                    lockAddress: true,
                                    lockComment: true,
                                    action: 'top_up' as TransferAction,
                                },
                                {
                                    ledger: isLedger,
                                    replace: true
                                }
                            );
                            return;
                        }

                        navigation.navigateStakingTransfer(
                            {
                                target: target.toString({ testOnly: network.isTestnet }),
                                amount: transferAmount.toString(),
                                lockAddress: true,
                                lockComment: true,
                                action: 'top_up' as TransferAction,
                            },
                            {
                                ledger: isLedger,
                                replace: true
                            }
                        );
                    }}
                />
            </KeyboardAvoidingView>
        </>

    );
});