import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fromNano, toNano } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CheckBox } from "../components/CheckBox";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { LocalizedResources } from "../i18n/schema";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ProductButton } from "./wallet/products/ProductButton";

export type SpamFilterConfig = {
    minAmount: BN | null,
    dontShowComments: boolean | null,
    denyList: string[] | null,
}

async function confirm(title: LocalizedResources) {
    return await new Promise<boolean>(resolve => {
        Alert.alert(t(title), t('transfer.confirm'), [{
            text: t('common.yes'),
            style: 'destructive',
            onPress: () => {
                resolve(true)
            }
        }, {
            text: t('common.no'),
            onPress: () => {
                resolve(false);
            }
        }])
    });
}

export const SpamFilterFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const settings = engine.products.settings;
    const dontShow = settings.useDontShowComments();
    const min = settings.useSpamMinAmount();
    const denyList = settings.useDenyList();
    const [dontShowComments, setDontShowComments] = useState<boolean>(dontShow);
    const [minValue, setMinValue] = useState<string>(fromNano(min));

    const onApply = useCallback(
        async () => {
            const confirmed = await confirm('spamFilter.applyConfig');
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
                    dontShowComments: dontShowComments,
                    denyList: denyList
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
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
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
                            marginHorizontal: 16,
                            marginVertical: 8,
                            color: denyList.length > 0 ? Theme.textColor : Theme.textSecondary
                        }}>
                            {denyList.length > 0 ? t('spamFilter.denyList') : t('spamFilter.denyListEmpty')}
                        </Text>
                    </View>
                    {denyList.map((d) => {
                        <ProductButton
                            key={`blocked-${d}`}
                            name={d}
                            subtitle={''}
                            image={undefined}
                            value={null}
                            onPress={() => {
                                // TODO remove from denyList
                            }}
                            style={{ marginVertical: 4 }}
                        />
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