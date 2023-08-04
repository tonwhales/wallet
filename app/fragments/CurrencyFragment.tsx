import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { Platform, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEngine } from "../engine/Engine";
import { CurrencySymbols, PrimaryCurrency } from "../engine/products/PriceProduct";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { confirmAlertWithTitle } from "../utils/confirmAlert";
import { useAppConfig } from "../utils/AppConfigContext";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { ScreenHeader } from "../components/ScreenHeader";
import Animated from "react-native-reanimated";

import IcCheck from "../../assets/ic-check.svg";

export const CurrencyFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const priceProduct = engine.products.price;
    const currency = priceProduct.usePrimaryCurrency();
    const { Theme } = useAppConfig();

    const onCurrency = useCallback(
        async (code: string) => {
            if (currency === code) {
                return;
            }
            const c = await confirmAlertWithTitle(t('confirm.changeCurrency', { currency: code }));
            if (c) {
                priceProduct.setPrimaryCurrency(code)
            }
        },
        [currency],
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('settings.primaryCurrency')}
                onBackPressed={navigation.goBack}
            />
            <ScrollView
                style={{ marginTop: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
            >
                <View style={{
                    backgroundColor: Theme.item,
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
                                            backgroundColor: Theme.lightGrey,
                                            marginBottom: 16, marginHorizontal: 16
                                        },
                                        animatedStyle
                                    ]}>
                                    <Text style={{
                                        fontWeight: '600',
                                        marginLeft: 17,
                                        fontSize: 17
                                    }}>
                                        {`${PrimaryCurrency[key]} (${CurrencySymbols[PrimaryCurrency[key]].symbol})`}
                                    </Text>
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 24, width: 24,
                                        backgroundColor: PrimaryCurrency[key] === currency ? Theme.accent : Theme.mediumGrey,
                                        borderRadius: 12
                                    }}>
                                        {PrimaryCurrency[key] === currency && (
                                            <IcCheck
                                                color={Theme.white}
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