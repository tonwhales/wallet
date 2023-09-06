import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano } from "ton";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { ATextInput } from "../../components/ATextInput";
import { CloseButton } from "../../components/CloseButton";
import { PriceComponent } from "../../components/PriceComponent";
import { RoundButton } from "../../components/RoundButton";
import { StakingCalcComponent } from "../../components/Staking/StakingCalcComponent";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { parseAmountToValidBN } from "../../utils/parseAmount";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useFocusEffect } from "@react-navigation/native";

export const StakingCalculatorFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const params = useParams<{ target: Address }>();
    const engine = useEngine();
    const pool = engine.products.whalesStakingPools.usePool(params.target);
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();

    const [amount, setAmount] = useState(pool?.member.balance ? fromNano(pool.member.balance) : '');

    const onChangeAmount = useCallback(
        (value: string) => {
            let amount = value;
            if (amount.length <= 10) {
                setAmount(amount);
                return;
            }

            if (amount.includes(',')) {
                amount = amount.replace(',', '.');
                const parts = amount.split('.');
                if (parts.length === 2) {
                    if (parts[0].length <= 10) {
                        setAmount(amount);
                    } else {
                        setAmount((prev) => prev);
                    }
                }
            }

            if (amount.includes('.')) {
                const parts = amount.split('.');
                if (parts.length === 2) {
                    if (parts[0].length <= 10) {
                        setAmount(amount);
                    } else {
                        setAmount((prev) => prev);
                    }
                }
            }
        }, [setAmount]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Platform.OS === 'ios' ? 'light' : 'dark');
        }, 100);
    });

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('products.staking.calc.text')}
                onClosePressed={navigation.goBack}
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
                <View
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <View style={{
                        marginBottom: 0,
                        backgroundColor: Theme.lightGrey,
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
                                color: Theme.textSecondary,
                            }}>
                                {t('common.amount')}
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
                                    value={amount}
                                    onValueChange={onChangeAmount}
                                    placeholder={'0'}
                                    keyboardType={'numeric'}
                                    textAlign={'left'}
                                    style={{ paddingHorizontal: 0, backgroundColor: Theme.transparent, marginTop: 4, flexShrink: 1 }}
                                    inputStyle={{ color: Theme.accent, flexGrow: 1, paddingTop: 0 }}
                                    fontWeight={'800'}
                                    fontSize={30}
                                    editable={true}
                                    enabled={true}
                                    preventDefaultHeight
                                    preventDefaultLineHeight
                                    preventDefaultValuePadding
                                    blurOnSubmit={false}
                                />
                            </View>
                            <PriceComponent
                                amount={parseAmountToValidBN(amount)}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0
                                }}
                                textStyle={{ color: Theme.priceSecondary, fontWeight: '400' }}
                            />
                        </View>
                    </View>
                    {!!pool && (
                        <StakingCalcComponent
                            amount={amount}
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
                    title={t('common.back')}
                    action={async () => navigation.goBack()}
                />
            </KeyboardAvoidingView>
        </>

    );
});