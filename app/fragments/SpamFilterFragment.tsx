import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../components/ATextInput";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemSwitch } from "../components/Item";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { useDenyList, useDontShowComments, useRemoveFromDenyList, useSpamMinAmount, useTheme } from "../engine/hooks";
import { Address, fromNano, toNano } from "@ton/core";
import { confirmAlert } from "../utils/confirmAlert";
import { StatusBar } from "expo-status-bar";

import IcSpamNonen from '@assets/ic-spam-none.svg';
import IcInfo from '@assets/ic-info.svg';

export type SpamFilterConfig = {
    minAmount: bigint | null,
    dontShowComments: boolean | null
}

export const SpamFilterFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const denyMap = useDenyList();

    const removeFromDenyList = useRemoveFromDenyList();
    const [minAmount, updateMinAmount] = useSpamMinAmount();
    const [dontShow, updateDontshow] = useDontShowComments();

    const denyList = useMemo(() => {
        return Object.keys(denyMap);
    }, [denyMap]);

    const [dontShowComments, setDontShowComments] = useState<boolean>(dontShow);
    const [minValue, setMinValue] = useState<string>(fromNano(minAmount));

    const onUnblock = useCallback(async (addr: string) => {
        const confirmed = await confirmAlert('spamFilter.unblockConfirm');
        if (!confirmed) {
            return;
        }
        try {
            let parsed = Address.parseFriendly(addr);
            removeFromDenyList(parsed.address);
        } catch {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }
    }, [denyList]);

    useEffect(() => {
        let value: bigint
        try {
            const validAmount = minValue.replace(',', '.');
            value = toNano(validAmount);
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }
        updateMinAmount(value);
    }, [minValue]);

    useEffect(() => {
        updateDontshow(dontShowComments);
    }, [dontShowComments]);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('settings.spamFilter')}
                onClosePressed={navigation.goBack}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flexGrow: 1 }}
            >
                <ScrollView
                    style={{ flexBasis: 0 }}
                    contentInset={{ bottom: safeArea.bottom, top: 0.1 }}
                >
                    <View style={{
                        marginBottom: 16, marginTop: 22,
                        borderRadius: 14,
                        paddingHorizontal: 16
                    }}>
                        {denyList.length <= 0 && (
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 36 }}>
                                <IcSpamNonen
                                    height={68}
                                    width={68}
                                    style={{
                                        height: 68,
                                        width: 68,
                                        marginBottom: 32
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 32,
                                        fontWeight: '600',
                                        marginVertical: 16,
                                        color: theme.textPrimary,
                                        textAlign: 'center'
                                    }}
                                >
                                    {t('spamFilter.denyListEmpty')}
                                </Text>
                                <Text style={{
                                    fontSize: 17,
                                    color: theme.textSecondary,
                                    marginTop: 16,
                                    textAlign: 'center'
                                }}>
                                    {t('spamFilter.description')}
                                </Text>
                            </View>
                        )}
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginTop: 20,
                            paddingVertical: 20,
                            paddingHorizontal: 20,
                            width: '100%', borderRadius: 20
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <IcInfo
                                    height={16} width={16}
                                    style={{ height: 16, width: 16, marginRight: 12 }}
                                />
                                <Text style={{ fontSize: 17, fontWeight: '600', lineHeight: 24, color: theme.textPrimary }}>
                                    {t('spamFilter.minAmount')}
                                </Text>
                            </View>
                            <ATextInput
                                value={minValue}
                                onValueChange={setMinValue}
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
                                hideClearButton
                                prefix={'TON'}
                            />
                            <Text style={{
                                fontWeight: '500',
                                fontSize: 12,
                                color: theme.textSecondary,
                                alignSelf: 'flex-start',
                                marginTop: 4,
                            }}>
                                {t('spamFilter.minAmountDescription', { amount: fromNano(minAmount) })}
                            </Text>
                        </View>
                        <View style={{
                            marginTop: 16,
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 20,
                            justifyContent: 'center',
                        }}>
                            <ItemSwitch
                                title={t('spamFilter.dontShowComments')}
                                value={!dontShowComments}
                                onChange={() => {
                                    setDontShowComments(!dontShowComments)
                                }}
                                titleStyle={{
                                    fontSize: 17, fontWeight: '400'
                                }}
                            />
                        </View>
                        <View style={{ marginTop: 16, paddingBottom: 56 }}>
                            {denyList.map((d) => {
                                return (
                                    <ContactItemView
                                        key={`contact-${d[0]}`}
                                        addr={d}
                                        action={() => onUnblock(d)}
                                    />
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});