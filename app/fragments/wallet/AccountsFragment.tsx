import { StatusBar } from "expo-status-bar";
import { useLayoutEffect, useRef } from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { JettonProduct } from "./products/JettonProduct";

export const AccountsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const jettons = engine.products.main.useJettons();
    const active = jettons.filter((j) => !j.disabled);
    const disabled = jettons.filter((j) => j.disabled);

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
                    paddingHorizontal: 16,
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LottieView
                        ref={anim}
                        source={require('../../../assets/animations/empty.json')}
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
                        color: '#6D6D71'
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
                                    color: '#6D6D71'
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
                                <JettonProduct
                                    key={'jt' + j.wallet.toFriendly()}
                                    jetton={j}
                                    navigation={navigation}
                                    engine={engine}
                                // onPress={() => promptDisable(j.master, j.symbol)}
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
                                    // onPress={() => promptActive(j.master, j.symbol)}
                                    onLongPress={() => { }}
                                />
                            );
                        })}
                    </View>
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