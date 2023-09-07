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
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemGroup } from "../components/ItemGroup";
import { useRoute } from "@react-navigation/native";

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
    const route = useRoute();
    const inSettings = route.name === 'AccountsSettings';

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
            if (inSettings) {
                navigation.setOptions({
                    headerShown: true,
                    title: t('products.accounts'),
                })
            }
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, [navigation]);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={(Platform.OS === 'ios' && !inSettings) ? 'light' : 'dark'} />
            {!inSettings ? (
                <ScreenHeader
                    title={t('products.accounts')}
                    onClosePressed={navigation.goBack}
                />
            ) : (
                <AndroidToolbar
                    onBack={navigation.goBack}
                    style={{ height: 44, marginTop: 16 }}
                    pageTitle={t('products.accounts')}
                />
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
                    }}>
                        {t('accounts.noAccounts')}
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textSecondary,
                        textAlign: 'center',
                    }}>
                        {t('accounts.description')}
                    </Text>
                </View>
            )}
            {jettons.length > 0 && (
                <ScrollView
                    style={{ flexGrow: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    contentInset={{ bottom: safeArea.bottom + 62 /*ProductButton height*/ + 16 /* vertical margins */ }}
                >
                    <View style={{
                        marginBottom: 16,
                        marginTop: 17,
                        borderRadius: 14,
                        flexShrink: 1,
                    }}>
                        <View style={{ marginTop: 8 }} collapsable={false}>
                            {disabled.length === 0 && (
                                <Text style={{
                                    fontSize: 16,
                                    color: Theme.textSecondary
                                }}
                                >
                                    {t('accounts.description')}
                                </Text>
                            )}
                            {jettons.length > 0 && (
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginVertical: 8,
                                    color: active.length > 0 ? Theme.textColor : Theme.textSecondary
                                }}
                                >
                                    {active.length > 0 ? t('accounts.active') : t('accounts.noActive')}
                                </Text>
                            )}
                        </View>
                        {active.length > 0 && (
                            <ItemGroup style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                                {active.map((j, index) => {
                                    return (
                                        <JettonProductItem
                                            key={'jt' + j.wallet.toFriendly()}
                                            jetton={j}
                                            engine={engine}
                                            onPress={() => promptDisable(j.master, j.symbol)}
                                            last={index === active.length - 1}
                                        />
                                    );
                                })}
                            </ItemGroup>
                        )}
                        {disabled.length > 0 && (
                            <View style={{ marginTop: active.length > 0 ? 16 : 8 }} collapsable={false}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginVertical: 8
                                }}
                                >
                                    {t('accounts.disabled')}
                                </Text>
                            </View>
                        )}
                        {disabled.length > 0 && (
                            <ItemGroup style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                                {disabled.map((j, index) => {
                                    return (
                                        <JettonProductItem
                                            key={'jt' + j.wallet.toFriendly()}
                                            jetton={j}
                                            engine={engine}
                                            onPress={() => promptActive(j.master, j.symbol)}
                                            onLongPress={() => { }}
                                            last={index === disabled.length - 1}
                                        />
                                    );
                                })}
                            </ItemGroup>
                        )}
                    </View>
                    <View style={{ height: 62 /*ProductButton height*/ + 16 /* vertical margins */ }} />
                </ScrollView>
            )}
        </View>
    );
});