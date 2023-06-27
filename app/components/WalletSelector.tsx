import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useAppConfig } from "../utils/AppConfigContext";
import { useAppStateManager } from "../engine/AppStateManager";
import { t } from "../i18n/t";
import { ellipsiseAddress } from "./WalletAddress";
import IcCheck from "../../assets/ic-check.svg";

export const WalletSelector = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();

    return (
        <View style={{
            paddingTop: 40,
            paddingHorizontal: 16
        }}>
            <Text style={{
                fontSize: 32, fontWeight: '600',
                lineHeight: 38,
                color: Theme.textColor
            }}>
                {t('common.wallets')}
            </Text>
            <ScrollView style={{ marginTop: 16 }}>
                {appStateManager.current.addresses.map((wallet, index) => {
                    return (
                        <Pressable
                            style={{
                                backgroundColor: '#F7F8F9',
                                padding: 20,
                                marginBottom: 16,
                                borderRadius: 20,
                                borderWidth: index === appStateManager.current.selected ? 2 : 0,
                                borderColor: Theme.accent,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            onPress={() => { }}
                        >
                            <View style={{ height: 42.2, width: 42.2, backgroundColor: Theme.accent, borderRadius: 22, marginRight: 12 }} />
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
            </ScrollView>
        </View>
    );
});