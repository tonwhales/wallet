import { memo, useCallback } from "react";
import { Pressable, View, Text, Alert } from "react-native";
import { Address } from "ton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useEngine } from "../../engine/Engine";
import { Avatar } from "../Avatar";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../WalletAddress";
import { useAppStateManager } from "../../engine/AppStateManager";

import IcCheck from "../../../assets/ic-check.svg";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const WalletItem = memo((
    {
        index,
        address,
        selected
    }: {
        index: number
        address: Address,
        selected?: boolean,
    }
) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const walletSettings = engine.products.wallets.useWalletSettings(address);
    const appStateManager = useAppStateManager();

    const onSelectAccount = useCallback(() => {
        if (selected) return;
        const index = appStateManager.current.addresses.findIndex((a) => a.address.toFriendly() === address.toFriendly());
        navigation.goBack();
        appStateManager.updateAppState({
            ...appStateManager.current,
            selected: index
        });
    }, [walletSettings, selected, address]);

    return (
        <Pressable
            style={{
                backgroundColor: Theme.surfaceSecondary,
                padding: 20,
                marginBottom: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
            onPress={onSelectAccount}
        >
            <View style={{
                height: 46, width: 46,
                backgroundColor: Theme.accent,
                borderRadius: 23,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Avatar
                    borderWith={0}
                    id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                    size={46}
                    hash={walletSettings?.avatar}
                />
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <Text
                    style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: Theme.textPrimary,
                        marginBottom: 2,
                        maxWidth: '90%',
                    }}
                    numberOfLines={1}
                >
                    {walletSettings?.name || `${t('common.wallet')} ${index + 1}`}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: '400', color: '#838D99' }}>
                    {ellipsiseAddress(address.toFriendly({ testOnly: AppConfig.isTestnet }))}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 24, width: 24,
                backgroundColor: selected ? Theme.accent : Theme.divider,
                borderRadius: 12
            }}>
                {selected && (
                    <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
                )}
            </View>
        </Pressable>
    )
})