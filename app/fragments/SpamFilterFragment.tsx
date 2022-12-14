import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano, toNano } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CheckBox } from "../components/CheckBox";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { confirmAlert } from "../utils/confirmAlert";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ProductButton } from "./wallet/products/ProductButton";
import SpamIcon from '../../assets/known/spam_icon.svg';

export type SpamFilterConfig = {
    minAmount: BN | null,
    dontShowComments: boolean | null
}

export const SpamFilterFragment = fragment(() => {
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
                } catch (e) {
                    console.warn(e);
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
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('settings.spamFilter')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
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
                        backgroundColor: "white",
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
                                backgroundColor: 'transparent',
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
                                        color: '#7D858A',
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
                            color: '#7D858A',
                            alignSelf: 'flex-start',
                            marginTop: 8,
                            marginHorizontal: 16
                        }}>
                            {t('spamFilter.minAmountDescription', { amount: fromNano(min) })}
                        </Text>
                        <View style={{ height: 1, marginVertical: 16, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                        <CheckBox
                            checked={!dontShowComments}
                            onToggle={() => {
                                setDontShowComments(!dontShowComments);
                            }}
                            text={t('spamFilter.dontShowComments')}
                            style={{ marginHorizontal: 16 }}
                        />
                    </View>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
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
                                    color: '#6D6D71',
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