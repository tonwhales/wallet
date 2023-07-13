import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAppStateManager } from "../../engine/AppStateManager";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../WalletAddress";
import IcCheck from "../../../assets/ic-check.svg";
import { Address } from "ton";
import { shortAddress } from "../../utils/shortAddress";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Avatar } from "../Avatar";

export const WalletSelector = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const safeArea = useSafeAreaInsets();

    const onSelectAccount = React.useCallback((selected: boolean, address: Address) => {
        if (selected) return;
        const index = appStateManager.current.addresses.findIndex((a) => a.address.toFriendly() === address.toFriendly());
        Alert.alert(
            t('wallets.switchToAlertTitle', { wallet: shortAddress({ address, isTestnet: AppConfig.isTestnet }) }),
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
                        <Pressable
                            key={`wallet-${index}`}
                            style={{
                                backgroundColor: '#F7F8F9',
                                padding: 20,
                                marginBottom: 16,
                                borderRadius: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            onPress={() => onSelectAccount(index === appStateManager.current.selected, wallet.address)}
                        >
                            <View style={{
                                height: 46, width: 46,
                                backgroundColor: Theme.accent,
                                borderRadius: 23,
                                marginRight: 12,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Avatar backgroundColor={Theme.accent} id={wallet.address.toFriendly({ testOnly: AppConfig.isTestnet })} size={46} />
                            </View>
                            <View style={{ justifyContent: 'center', flexGrow: 1 }}>
                                <Text style={{ fontSize: 17, lineHeight: 24, fontWeight: '600', color: Theme.textColor, marginBottom: 2 }}>
                                    {t('common.wallet')} {index + 1}
                                </Text>
                                <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: '400', color: '#838D99' }}>
                                    {ellipsiseAddress(wallet.address.toFriendly({ testOnly: AppConfig.isTestnet }))}
                                </Text>
                            </View>
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 24, width: 24,
                                backgroundColor: index === appStateManager.current.selected ? Theme.accent : '#E4E6EA',
                                borderRadius: 12
                            }}>
                                <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
                            </View>
                        </Pressable>
                    )
                })}
                <View style={{ height: safeArea.bottom + 56 }} />
            </BottomSheetScrollView>
        </View>
    );
});