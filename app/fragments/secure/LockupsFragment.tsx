import React, { } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import BN from "bn.js";
import { LockupProductButton } from "../../LockupProductButton";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../components/CloseButton";

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
        // let at = lockup.address.toFriendly({ testOnly: AppConfig.isTestnet });
        items.push(
            <LockupProductButton
                key={lockup.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                address={lockup.address}
                value={balance}
            />
        );
    }


    return (
        <View style={{ flexGrow: 1, flex: 1 }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={t('products.lockups.title', { count: lockupWallets.length })}
            />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 17,
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.lockups.title', { count: lockupWallets.length })}
                    </Text>
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