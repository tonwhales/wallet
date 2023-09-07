import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano, toNano } from "ton";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CheckBox } from "../components/CheckBox";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import SpamIcon from '../../assets/known/spam_icon.svg';
import { useAppConfig } from "../utils/AppConfigContext";
import { ProductButton } from "../components/products/ProductButton";
import { ScreenHeader } from "../components/ScreenHeader";

export type SpamFilterConfig = {
    minAmount: BN | null,
    dontShowComments: boolean | null
}

export const SpamFilterFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const settings = engine.products.settings;
    const dontShow = settings.useDontShowComments();
    const min = settings.useSpamMinAmount();
    const denyMap = settings.useDenyList();
    const denyList = React.useMemo(() => {
        return Object.keys(denyMap);
    }, [denyMap]);
    const [dontShowComments, setDontShowComments] = useState<boolean>(dontShow);
    const [minValue, setMinValue] = useState<string>(fromNano(min));

    const onUnblock = useCallback(
        async (addr: string) => {
            const confirmed = await confirmAlert('spamFilter.unblockConfirm');
            if (confirmed) {
                try {
                    let parsed = Address.parseFriendly(addr);
                    settings.removeFromDenyList(parsed.address);
                } catch {
                    Alert.alert(t('transfer.error.invalidAddress'));
                    return;
                }
            }
        }, [denyList]
    );

    const onApply = useCallback(
        async () => {
            const confirmed = await confirmAlert('spamFilter.applyConfig');
            if (confirmed) {
                let value: BN
                try {
                    const validAmount = minValue.replace(',', '.');
                    value = toNano(validAmount);
                } catch (e) {
                    Alert.alert(t('transfer.error.invalidAmount'));
                    return;
                }
                settings.setSpamFilter({
                    minAmount: value,
                    dontShowComments: dontShowComments
                });

                return;
            }

            setDontShowComments(dontShow);
            setMinValue(fromNano(min));
        },
        [dontShowComments, minValue, min, denyList, dontShow],
    );

    useEffect(() => {
        setDontShowComments(dontShow);
        setMinValue(fromNano(min));
    }, [min, dontShow]);

    const disabled = dontShowComments === dontShow && minValue === fromNano(min);

    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            navigation.setOptions({
                headerShown: true,
                title: t('settings.spamFilter'),
            });
        }
    }, [navigation]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom + 16,
        }}>
            <StatusBar style={'dark'} />
            <AndroidToolbar
                onBack={navigation.goBack}
                style={{ height: 44, marginTop: 16 }}
                pageTitle={t('settings.spamFilter')}
            />
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16
                }}>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: Theme.border,
                        borderRadius: 20,
                        justifyContent: 'center',
                        padding: 20
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
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
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
                                        color: Theme.textSecondary,
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
                            color: Theme.textSecondary,
                            alignSelf: 'flex-start',
                            marginTop: 8,
                        }}>
                            {t('spamFilter.minAmountDescription', { amount: fromNano(min) })}
                        </Text>
                        <View style={{ height: 1, marginVertical: 16, alignSelf: 'stretch', backgroundColor: Theme.divider }} />
                        <CheckBox
                            checked={!dontShowComments}
                            onToggle={() => {
                                setDontShowComments(!dontShowComments);
                            }}
                            text={t('spamFilter.dontShowComments')}
                        />
                    </View>
                    <View style={{ marginTop: 8 }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginVertical: 8,
                            color: Theme.textColor
                        }}>
                            {t('spamFilter.denyList')}
                        </Text>
                        {denyList.length <= 0 && (
                            <>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '700',
                                    marginVertical: 8,
                                    color: Theme.textSecondary
                                }}>
                                    {t('spamFilter.denyListEmpty')}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    color: Theme.textSecondary,
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
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton
                    title={t('common.apply')}
                    onPress={onApply}
                    disabled={disabled}
                    display={disabled ? 'secondary' : 'default'}
                />
            </View>
        </View>
    );
});