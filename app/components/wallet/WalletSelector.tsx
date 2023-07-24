import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAppStateManager } from "../../engine/AppStateManager";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../WalletAddress";
import { Address } from "ton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Avatar } from "../Avatar";
import { WalletItem } from "./WalletItem";

export const WalletSelector = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const safeArea = useSafeAreaInsets();

    const onSelectAccount = React.useCallback((selected: boolean, address: Address, name?: string) => {
        if (selected) return;
        const index = appStateManager.current.addresses.findIndex((a) => a.address.toFriendly() === address.toFriendly());
        Alert.alert(
            t('wallets.switchToAlertTitle', { wallet: `${t('common.wallet')} ${index + 1}` }),
            t('wallets.switchToAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('wallets.switchToAlertAction'),
                    onPress: () => {
                        appStateManager.updateAppState({
                            ...appStateManager.current,
                            selected: index
                        });
                    },
                }
            ]
        );
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: 40,
            paddingHorizontal: 16, justifyContent: 'space-evenly',
        }}>
            <Text style={{
                fontSize: 32, fontWeight: '600',
                lineHeight: 38,
                color: Theme.textColor
            }}>
                {t('common.wallets')}
            </Text>
            <BottomSheetScrollView style={{ minHeight: 356, marginTop: 16 }} showsVerticalScrollIndicator={false}>
                {appStateManager.current.addresses.map((wallet, index) => {
                    return (
                        <WalletItem
                            key={`wallet-${index}`}
                            index={index}
                            address={wallet.address}
                            selected={index === appStateManager.current.selected}
                        />
                    )
                })}
                <View style={{ height: safeArea.bottom + 56 }} />
            </BottomSheetScrollView>
        </View>
    );
});