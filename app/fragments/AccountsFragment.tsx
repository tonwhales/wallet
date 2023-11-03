import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { JettonProduct, confirmJettonAction } from "./wallet/products/JettonProduct";
import LottieView from 'lottie-react-native';
import { useTheme } from '../engine/hooks';
import { useJettons } from '../engine/hooks';
import { useSelectedAccount } from "../engine/hooks/appstate/useSelectedAccount";

export const AccountsFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();

    const jettons = useJettons(selected!.addressString);
    const active = jettons.filter((j: any) => !j.disabled);
    const disabled = jettons.filter((j: any) => j.disabled);

    const promptDisable = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(true, symbol);
           // TODO: if (c) markJettonDisabled(master);
        },
        [],
    );
    const promptActive = useCallback(
        async (master: Address, symbol: string) => {
            const c = await confirmJettonAction(false, symbol);
            // TODO: if (c) markJettonActive(master);
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
                        color: theme.textColor,
                    }}
                    >
                        {t('accounts.noAccounts')}
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: theme.priceSecondary
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
                        <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                            {disabled.length === 0 && (
                                <Text style={{
                                    marginHorizontal: 16,
                                    fontSize: 16,
                                    color: theme.priceSecondary
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
                                    color: active.length > 0 ? theme.textColor : theme.textSecondary
                                }}
                                >
                                    {active.length > 0 ? t('accounts.active') : t('accounts.noActive')}
                                </Text>
                            )}
                        </View>
                        {active.map((j: any) => {
                            return (
                                <JettonProduct
                                    key={'jt' + j.wallet.toString()}
                                    jetton={j}
                                    navigation={navigation}
                                    onPress={() => promptDisable(j.master, j.symbol)}
                                />
                            );
                        })}
                        {disabled.length > 0 && (
                            <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
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
                        {disabled.map((j: any) => {
                            return (
                                <JettonProduct
                                    key={'jt' + j.wallet.toString()}
                                    jetton={j}
                                    navigation={navigation}
                                    onPress={() => promptActive(j.master, j.symbol)}
                                    onLongPress={() => { }}
                                />
                            );
                        })}
                    </View>
                    <View style={{ height: 62 /*ProductButton height*/ + 16 /* vertical margins */ }} />
                </ScrollView>
            )}
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