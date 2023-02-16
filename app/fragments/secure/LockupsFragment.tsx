import React, { } from "react";
import { Platform, View, Text, ScrollView, TouchableNativeFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { ProductButton } from "../wallet/products/ProductButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from "expo-blur";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton } from "@react-navigation/elements";
import BN from "bn.js";

export const LockupsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const lockupWallets = engine.products.lockup.useLockupWallets();
    const items: React.ReactElement[] = [];

    for (let lockup of lockupWallets) {
        let balance = new BN(0);
        balance = balance.add(lockup.state.balance);
        if (lockup.state.wallet?.totalLockedValue) {
            balance = balance.add(lockup.state.wallet.totalLockedValue);
        }
        if (lockup.state.wallet?.totalRestrictedValue) {
            balance = balance.add(lockup.state.wallet.totalRestrictedValue);
        }
        let at = lockup.address.toFriendly({ testOnly: AppConfig.isTestnet });
        items.push(
            <ProductButton
                key={lockup.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                name={t('products.lockups.wallet')}
                subtitle={at.slice(0, 6) + '...' + at.slice(t.length - 8)}
                requireSource={require('../../../assets/ic_wallet_2.png')}
                value={balance}
                onPress={() => {
                    navigation.navigate('LockupWallet', { address: lockup.address.toFriendly({ testOnly: AppConfig.isTestnet }) });
                }}
            />
        );
    }


    return (
        <View style={{ flexGrow: 1, flex: 1 }}>
            {Platform.OS === 'ios' && (
                <BlurView style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <HeaderBackButton
                            style={{
                                position: 'absolute',
                                left: 0, bottom: 0
                            }}
                            label={t('common.back')}
                            labelVisible
                            onPress={() => {
                                navigation.goBack();
                            }}
                            tintColor={Theme.accent}
                        />
                        <Text style={[
                            { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                        ]}>
                            {t('products.lockups.title')}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </BlurView>
            )}
            {Platform.OS === 'android' && (
                <View style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        position: 'absolute',
                        left: 16, bottom: 8
                    }}>
                        <TouchableNativeFeedback
                            onPress={() => {
                                navigation.goBack();
                            }}
                            background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                        >
                            <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[
                            { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                        ]}>
                            {t('products.lockups.title')}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </View>
            )}
            <ScrollView
                alwaysBounceVertical={false}
                style={{
                    flexShrink: 1,
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                }}
                contentContainerStyle={{
                    paddingTop: 8
                }}
            >
                <View style={{ flexGrow: 1 }}>

                    {items}
                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
            <View style={{ height: safeArea.bottom }} />
        </View>
    );
});