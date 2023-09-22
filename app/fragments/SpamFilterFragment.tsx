import BN from "bn.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano, toNano } from "ton";
import { ATextInput } from "../components/ATextInput";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import SpamIcon from '@assets/known/spam_icon.svg';
import { useAppConfig } from "../utils/AppConfigContext";
import { ProductButton } from "../components/products/ProductButton";
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemSwitch } from "../components/Item";

import IcSpamNonen from '@assets/ic-spam-none.svg';
import IcInfo from '@assets/ic-info.svg';
import { ContactItemView } from "../components/Contacts/ContactItemView";

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
    const denyList = useMemo(() => {
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

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <ScreenHeader
                title={t('settings.spamFilter')}
                onClosePressed={navigation.goBack}
                statusBarStyle={Platform.select({ ios: 'light', android: Theme.style === 'dark' ? 'light' : 'dark' })}
            />
            <ScrollView style={{ flexGrow: 1 }}>
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
                                    color: Theme.textPrimary,
                                    textAlign: 'center'
                                }}
                            >
                                {t('spamFilter.denyListEmpty')}
                            </Text>
                            <Text style={{
                                fontSize: 17,
                                color: Theme.textSecondary,
                                marginTop: 16,
                                textAlign: 'center'
                            }}>
                                {t('spamFilter.description')}
                            </Text>
                        </View>
                    )}
                    <View style={{
                        backgroundColor: Theme.surfaceSecondary,
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
                            <Text style={{ fontSize: 17, fontWeight: '600', lineHeight: 24 }}>
                                {t('spamFilter.minAmount')}
                            </Text>
                        </View>
                        <ATextInput
                            value={minValue}
                            onValueChange={setMinValue}
                            keyboardType={'numeric'}
                            style={{
                                backgroundColor: Theme.background,
                                paddingHorizontal: 16, paddingVertical: 14,
                                borderRadius: 16,
                            }}
                            inputStyle={{
                                fontSize: 17, fontWeight: '400',
                                textAlignVertical: 'top',
                                color: Theme.textPrimary,
                                width: 'auto',
                                flexShrink: 1
                            }}
                            hideClearButton
                            prefix={'TON'}
                        />
                        <Text style={{
                            fontWeight: '500',
                            fontSize: 12,
                            color: Theme.textSecondary,
                            alignSelf: 'flex-start',
                            marginTop: 4,
                        }}>
                            {t('spamFilter.minAmountDescription', { amount: fromNano(min) })}
                        </Text>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: Theme.surfaceSecondary,
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
                    <View style={{ marginTop: 16 }}>
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