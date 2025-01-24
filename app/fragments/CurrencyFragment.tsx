import React from "react";
import { Platform, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePrimaryCurrency, useTheme } from "../engine/hooks";
import { CurrencySymbols, PrimaryCurrency } from "../utils/formatCurrency";
import { StatusBar } from "expo-status-bar";
import { ToastDuration, useToaster } from "../components/toast/ToastProvider";

import IcCheck from "@assets/ic-check.svg";

export const CurrencyFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    let [currency, setPrimaryCurrency] = usePrimaryCurrency();
    const theme = useTheme();
    const toaster = useToaster();

    const onCurrency = (code: string) => {
        if (currency === code) return;
        setPrimaryCurrency(code);
        toaster.show({
            message: `${t('common.currencyChanged')}: ${code}`,
            type: 'default',
            duration: ToastDuration.SHORT,
        })
    };

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('settings.primaryCurrency')}
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentInset={{ bottom: safeArea.bottom === 0 ? 16 : safeArea.bottom + 16 }}
            >
                <View style={{
                    borderRadius: 14,
                    justifyContent: 'center',
                }}>
                    {Object.keys(PrimaryCurrency).map((key, index) => {
                        const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();
                        return (
                            <Pressable
                                key={`${key}-${index}`}
                                onPress={() => onCurrency(PrimaryCurrency[key])}
                                onPressIn={onPressIn}
                                onPressOut={onPressOut}
                            >
                                <Animated.View
                                    style={[
                                        {
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 20,
                                            borderRadius: 20,
                                            backgroundColor: theme.surfaceOnElevation,
                                            marginBottom: 16, marginHorizontal: 16
                                        },
                                        animatedStyle
                                    ]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{
                                            fontWeight: '600',
                                            fontSize: 17,
                                            color: theme.textPrimary
                                        }}>
                                            {`${PrimaryCurrency[key]} (${CurrencySymbols[PrimaryCurrency[key]].symbol})`}
                                        </Text>
                                        <Text style={{
                                            color: theme.textSecondary,
                                            fontWeight: '400',
                                            marginLeft: 12, fontSize: 15,
                                            textAlign: 'left'
                                        }}>
                                            {`${CurrencySymbols[PrimaryCurrency[key]].label}`}
                                        </Text>
                                    </View>
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 24, width: 24,
                                        backgroundColor: PrimaryCurrency[key] === currency ? theme.accent : theme.divider,
                                        borderRadius: 12
                                    }}>
                                        {PrimaryCurrency[key] === currency && (
                                            <IcCheck
                                                color={theme.white}
                                                height={16} width={16}
                                                style={{ height: 16, width: 16 }}
                                            />
                                        )}
                                    </View>
                                </Animated.View>
                            </Pressable>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    );
});