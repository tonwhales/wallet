import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { useEngine } from "../engine/Engine";
import { markJettonActive, markJettonDisabled } from "../engine/sync/ops";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useAppConfig } from "../utils/AppConfigContext";
import { JettonProductItem } from "../components/products/JettonProductItem";

export async function confirmJettonAction(disable: boolean, symbol: string) {
    return await new Promise<boolean>(resolve => {
        Alert.alert(
            disable
                ? t('accounts.alertDisabled', { symbol })
                : t('accounts.alertActive', { symbol }),
            t('transfer.confirm'),
            [{
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

export const AccountsFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();

    const jettons = engine.products.main.useJettons();
    const active = jettons.filter((j) => !j.disabled);
    const disabled = jettons.filter((j) => j.disabled);

    const promptDisable = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(true, symbol);
            if (c) markJettonDisabled(engine, master);
        },
        [],
    );
    const promptActive = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(false, symbol);
            if (c) markJettonActive(engine, master);
        },
        [],
    );

    // 
    // Lottie animation
    // 
    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.accounts')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.accounts')}
                    </Text>
                </View>
            )}
            {jettons.length === 0 && (
                <View style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LottieView
                        ref={anim}
                        source={require('../../assets/animations/empty.json')}
                        autoPlay={true}
                        loop={true}
                        style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                    />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginBottom: 8,
                        textAlign: 'center',
                        color: Theme.textColor,
                    }}
                    >
                        {t('accounts.noAccounts')}
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: Theme.priceSecondary
                    }}
                    >
                        {t('accounts.description')}
                    </Text>
                </View>
            )}
            {jettons.length > 0 && (
                <ScrollView style={{ flexGrow: 1 }}>
                    <View style={{
                        marginBottom: 16,
                        marginTop: 17,
                        borderRadius: 14,
                        flexShrink: 1,
                    }}>
                        <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                            {disabled.length === 0 && (
                                <Text style={{
                                    marginHorizontal: 16,
                                    fontSize: 16,
                                    color: Theme.priceSecondary
                                }}
                                >
                                    {t('accounts.description')}
                                </Text>
                            )}
                            {jettons.length > 0 && (
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginHorizontal: 16,
                                    marginVertical: 8,
                                    color: active.length > 0 ? Theme.textColor : Theme.textSecondary
                                }}
                                >
                                    {active.length > 0 ? t('accounts.active') : t('accounts.noActive')}
                                </Text>
                            )}
                        </View>
                        {active.map((j) => {
                            return (
                                <JettonProductItem
                                    key={'jt' + j.wallet.toFriendly()}
                                    jetton={j}
                                    navigation={navigation}
                                    engine={engine}
                                    onPress={() => promptDisable(j.master, j.symbol)}
                                />
                            );
                        })}
                        {disabled.length > 0 && (
                            <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginHorizontal: 16,
                                    marginVertical: 8
                                }}
                                >
                                    {t('accounts.disabled')}
                                </Text>
                            </View>
                        )}
                        {disabled.map((j) => {
                            return (
                                <JettonProductItem
                                    key={'jt' + j.wallet.toFriendly()}
                                    jetton={j}
                                    navigation={navigation}
                                    engine={engine}
                                    onPress={() => promptActive(j.master, j.symbol)}
                                    onLongPress={() => { }}
                                />
                            );
                        })}
                    </View>
                    <View style={{ height: 62 /*ProductButton height*/ + 16 /* vertical margins */ }} />
                </ScrollView>
            )}
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});