import { useKeyboard } from "@react-native-community/hooks";
import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { createRef, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fromNano, toNano } from "ton";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { ATextInput } from "../../components/ATextInput";
import { PriceComponent } from "../../components/PriceComponent";
import { RoundButton } from "../../components/RoundButton";
import { StakingCalcComponent } from "../../components/Staking/StakingCalcComponent";
import { fragment } from "../../fragment";
import { useAccount } from "../../sync/Engine";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ATextInputRef } from "../secure/TransferFragment";

export const StakingCalcFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const [account, engine] = useAccount();
    const [amount, setAmount] = React.useState('0');
    const pool = engine.products.stakingPool.useState();
    const [minAmountWarn, setMinAmountWarn] = React.useState(false);
    const [amountInputFocused, setAmountInputFocused] = React.useState(false);
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const ref: React.RefObject<ATextInputRef> = createRef();

    const onFocus = useCallback((index: number) => {
        console.log('[onFocus]', index);
        setAmountInputFocused(true);
    }, []);

    const onSetAmount = useCallback(
        (newAmount: string) => {
            setMinAmountWarn(false);
            setAmount(newAmount);
        }, []);


    const onBlur = useCallback((index: number) => {
        setAmountInputFocused(false);
    }, []);

    const onDone = useCallback(() => {
        if (amountInputFocused) {
            ref.current?.blur();
        } else {
            navigation.goBack();
        }
    }, [amountInputFocused]);


    return (
        <View style={{
            flex: 1,
        }}>
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={t('products.staking.calc.text')}
            />
            <StatusBar style="light" />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: 17
                    }}>
                        {t('products.staking.calc.text')}
                    </Text>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                scrollEventThrottle={16}
            >
                <View
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <View style={{
                        marginBottom: 0,
                        backgroundColor: "white",
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
                                color: '#8E979D',
                            }}>
                                {t('common.amount')}
                            </Text>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#6D6D71',
                            }}>
                                {fromNano(account?.balance || new BN(0))} TON
                            </Text>
                        </View>
                        <View style={{
                            width: '100%',
                        }}>
                            <ATextInput
                                index={0}
                                ref={ref}
                                onFocus={onFocus}
                                value={amount}
                                onValueChange={onSetAmount}
                                placeholder={'0'}
                                keyboardType={'numeric'}
                                textAlign={'center'}
                                style={{ paddingHorizontal: 0, backgroundColor: 'transparent', marginTop: 4 }}
                                inputStyle={{ color: Theme.accent, flexGrow: 0, paddingTop: 0 }}
                                fontWeight={'800'}
                                fontSize={30}
                                onBlur={onBlur}
                                preventDefaultHeight
                                preventDefaultLineHeight
                                preventDefaultValuePadding
                                blurOnSubmit={false}
                            />
                            <PriceComponent
                                amount={toNano(parseFloat(amount.replace(',', '.')))}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                            />
                        </View>
                    </View>
                    {minAmountWarn && (
                        <Text style={{
                            color: '#FF0000',
                            fontWeight: '400',
                            fontSize: 14,
                            marginTop: 10
                        }}>
                            {t('products.staking.minAmountWarning', { minAmount: fromNano(pool!.minStake) })}
                        </Text>
                    )}
                    <StakingCalcComponent amount={amount} />
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
                    title={t('common.done')}
                    onPress={onDone}
                />
            </KeyboardAvoidingView>
        </View>
    );
})