import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { Platform, View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import CheckMark from '../../assets/ic_check_mark.svg';
import { confirmAlertWithTitle } from "../utils/confirmAlert";
import { useTheme } from '../engine/hooks/theme/useTheme';
import { usePrimaryCurrency } from '../engine/hooks/currency/usePrimaryCurrency';
import { CurrencySymbols, PrimaryCurrency } from "../utils/formatCurrency";

export const CurrencyFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [currency, setPrimaryCurrency] = usePrimaryCurrency();
    const theme = useTheme();

    const onCurrency = useCallback(
        async (code: string) => {
            if (currency === code) {
                return;
            }
            const c = await confirmAlertWithTitle(t('confirm.changeCurrency', { currency: code }));
            if (c) {
                setPrimaryCurrency(code);
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
            <AndroidToolbar pageTitle={t('settings.primaryCurrency')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('settings.primaryCurrency')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16
                }}>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingVertical: 16,
                    }}>
                        {Object.keys(PrimaryCurrency).map((key, index) => {
                            return (
                                <View key={`${key}-${index}`}>
                                    <Pressable
                                        style={({ pressed }) => {
                                            return {
                                                opacity: pressed ? 0.3 : 1
                                            }
                                        }}
                                        onPress={() => onCurrency(PrimaryCurrency[key])}
                                    >
                                        <View style={{ flexDirection: 'row', height: 24, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{
                                                fontWeight: '600',
                                                marginLeft: 17,
                                                fontSize: 17
                                            }}>
                                                {`${PrimaryCurrency[key]} (${CurrencySymbols[PrimaryCurrency[key]].symbol})`}
                                            </Text>
                                            {PrimaryCurrency[key] === currency &&
                                                <View style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: 24, width: 24, borderRadius: 4,
                                                    backgroundColor: theme.accent,
                                                    marginRight: 16
                                                }}>
                                                    <CheckMark color={theme.accent} />
                                                </View>
                                            }
                                        </View>
                                    </Pressable>
                                    {index !== Object.keys(PrimaryCurrency).length - 1 && (<View style={{ height: 1, marginVertical: 16, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 16 }} />)}
                                </View>
                            )
                        })}
                    </View>
                </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});