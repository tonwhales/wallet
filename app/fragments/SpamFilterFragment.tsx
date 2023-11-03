import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano, toNano } from "@ton/core";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CheckBox } from "../components/CheckBox";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ProductButton } from "./wallet/products/ProductButton";
import SpamIcon from '../../assets/known/spam_icon.svg';
import { useTheme } from '../engine/hooks';
import { useDontShowComments } from '../engine/hooks';
import { useSpamMinAmount } from '../engine/hooks';
import { useDenyList } from '../engine/hooks';
import { useRemoveFromDenyList } from "../engine/hooks/spam/useRemoveFromDenyList";

export type SpamFilterConfig = {
    minAmount: bigint | null,
    dontShowComments: boolean | null
}

export const SpamFilterFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [dontShow, setDontShow] = useDontShowComments();
    const [min, setMinAmount] = useSpamMinAmount();
    const denyMap = useDenyList();
    const denyList = React.useMemo(() => {
        return Object.keys(denyMap);
    }, [denyMap]);

    const [dontShowComments, setDontShowComments] = useState<boolean>(dontShow);
    const [minValue, setMinValue] = useState<string>(fromNano(min));

    const removeFromDenyList = useRemoveFromDenyList();

    const onUnblock = useCallback(async (addr: string) => {
        const confirmed = await confirmAlert('spamFilter.unblockConfirm');
        if (confirmed) {
            try {
                let parsed = Address.parseFriendly(addr);
                removeFromDenyList(parsed.address);
            } catch {
                Alert.alert(t('transfer.error.invalidAddress'));
                return;
            }
        }
    }, [removeFromDenyList]);

    const setSpamFilter = useCallback(({ minAmount, dontShowComments }: { minAmount: bigint, dontShowComments: boolean }) => {
        setMinAmount(minAmount);
        setDontShowComments(dontShowComments);
    }, [setDontShow, setMinAmount]);

    const onApply = useCallback(() => {
        let value: bigint
        try {
            const validAmount = minValue.replace(',', '.');
            value = toNano(validAmount);
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }
        setSpamFilter({
            minAmount: value,
            dontShowComments: dontShowComments
        });
    }, [dontShowComments, minValue, min, denyList, dontShow]);

    useEffect(() => {
        setMinValue(fromNano(min));
    }, [min]);

    useEffect(() => {
        setDontShowComments(dontShow);
    }, [dontShow]);


    const hasChanges = useMemo(() => {
        return (dontShowComments !== dontShow)
            || (minValue !== fromNano(min));
    }, [dontShowComments, minValue, min, dontShow]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('settings.spamFilter')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17,
                        color: theme.textPrimary
                    }, { textAlign: 'center' }]}>
                        {t('settings.spamFilter')}
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
                        backgroundColor: theme.surfacePimary,
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingVertical: 10,
                    }}>
                        <ATextInput
                            index={0}
                            value={minValue}
                            onValueChange={setMinValue}
                            placeholder={'0.05'}
                            keyboardType={'numeric'}
                            preventDefaultHeight
                            preventDefaultLineHeight
                            preventDefaultValuePadding
                            blurOnSubmit={false}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginHorizontal: 16
                            }}
                            label={
                                <View style={{
                                    flexDirection: 'row',
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden',
                                }}>
                                    <Text style={{
                                        fontWeight: '500',
                                        fontSize: 12,
                                        color: theme.textSecondary,
                                        alignSelf: 'flex-start',
                                    }}>
                                        {t('spamFilter.minAmount')}
                                    </Text>
                                </View>
                            }
                        />
                        <Text style={{
                            fontWeight: '500',
                            fontSize: 12,
                            color: theme.textSecondary,
                            alignSelf: 'flex-start',
                            marginTop: 8,
                            marginHorizontal: 16
                        }}>
                            {t('spamFilter.minAmountDescription', { amount: fromNano(min) })}
                        </Text>
                        <View style={{ height: 1, marginVertical: 16, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 16 + 24 }} />
                        <CheckBox
                            checked={!dontShowComments}
                            onToggle={() => {
                                setDontShowComments(!dontShowComments);
                            }}
                            text={t('spamFilter.dontShowComments')}
                            style={{ marginHorizontal: 16 }}
                        />
                    </View>
                    <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginVertical: 8,
                            color: theme.textPrimary
                        }}>
                            {t('spamFilter.denyList')}
                        </Text>
                        {denyList.length <= 0 && (
                            <>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '700',
                                    marginVertical: 8,
                                    color: theme.textSecondary
                                }}>
                                    {t('spamFilter.denyListEmpty')}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    color: theme.textSecondary,
                                    marginVertical: 8,
                                }}>
                                    {t('spamFilter.description')}
                                </Text>
                            </>
                        )}
                    </View>
                    {denyList.map((d) => {
                        return (
                            <ProductButton
                                key={`blocked-${d}`}
                                name={d.slice(0, 10) + '...' + d.slice(d.length - 6)}
                                subtitle={''}
                                icon={SpamIcon}
                                value={null}
                                onPress={() => onUnblock(d)}
                                style={{ marginVertical: 4, marginHorizontal: 0 }}
                            />
                        );
                    })}
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                keyboardVerticalOffset={16}
            >
                <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton
                        title={t('common.apply')}
                        onPress={onApply}
                        disabled={!hasChanges}
                        display={!hasChanges ? 'secondary' : 'default'}
                    />
                </View>
            </KeyboardAvoidingView>
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