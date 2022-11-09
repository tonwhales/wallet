import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { useEngine } from "../engine/Engine";
import { markJettonActive, markJettonDisabled } from "../engine/sync/ops";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { JettonProduct } from "./wallet/products/JettonProduct";

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
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();

    const jettons = engine.products.main.useJettons();
    const active = jettons.filter((j) => !j.disabled);
    const disabled = jettons.filter((j) => j.disabled);

    const promptDisable = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(true, symbol);
            if (c) markJettonDisabled(engine, engine.address, master);
        },
        [],
    );
    const promptActive = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(false, symbol);
            if (c) markJettonActive(engine, engine.address, master);
        },
        [],
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.accounts')} />
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
                        {t('products.accounts')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    flexShrink: 1,
                }}>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
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
                    </View>
                    {active.map((j) => {
                        return (
                            <JettonProduct
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
                            <JettonProduct
                                key={'jt' + j.wallet.toFriendly()}
                                jetton={j}
                                navigation={navigation}
                                engine={engine}
                                onPress={() => promptActive(j.master, j.symbol)}
                                onLongPress={() => {}}
                            />
                        );
                    })}
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