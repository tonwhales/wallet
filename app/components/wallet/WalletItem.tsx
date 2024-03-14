import { memo, useCallback } from "react";
import { Pressable, View, Text } from "react-native";
import { Avatar, avatarColors } from "../Avatar";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../address/WalletAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { useAppState, useBounceableWalletFormat, useNetwork, useSetAppState, useTheme, useWalletSettings } from "../../engine/hooks";
import { avatarHash } from "../../utils/avatarHash";

import IcCheck from "@assets/ic-check.svg";

export const WalletItem = memo((
    {
        index,
        address,
        selected,
        onSelect
    }: {
        index: number
        address: Address,
        selected?: boolean,
        onSelect?: (address: Address) => void
    }
) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const appState = useAppState();
    const updateAppState = useSetAppState();
    const [walletSettings,] = useWalletSettings(address);
    const [bounceableFormat,] = useBounceableWalletFormat();

    const avatarColorHash = walletSettings?.color ?? avatarHash(address.toString({ testOnly: network.isTestnet }), avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const onSelectAccount = useCallback(() => {
        if (onSelect) {
            onSelect(address);
            return;
        }
        if (selected) {
            navigation.navigateAndReplaceAll('Home');
            return;
        };
        const index = appState.addresses.findIndex((a) => a.address.equals(address));

        if (index < 0) {
            return;
        }

        // Select new account
        updateAppState({ ...appState, selected: index }, network.isTestnet);

        navigation.navigateAndReplaceAll('Home');
    }, [walletSettings, selected, address, network, onSelect]);

    return (
        <Pressable
            style={{
                backgroundColor: theme.surfaceOnElevation,
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
                backgroundColor: theme.accent,
                borderRadius: 23,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Avatar
                    borderWith={0}
                    id={address.toString({ testOnly: network.isTestnet })}
                    size={46}
                    hash={walletSettings?.avatar}
                    theme={theme}
                    isTestnet={network.isTestnet}
                    backgroundColor={avatarColor}
                />
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <Text
                    style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 2,
                        maxWidth: '90%',
                    }}
                    numberOfLines={1}
                >
                    {walletSettings?.name || `${t('common.wallet')} ${index + 1}`}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: '400', color: '#838D99' }}>
                    {ellipsiseAddress(address.toString({ testOnly: network.isTestnet, bounceable: bounceableFormat }))}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 24, width: 24,
                backgroundColor: selected ? theme.accent : theme.divider,
                borderRadius: 12
            }}>
                {selected && (
                    <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
                )}
            </View>
        </Pressable>
    )
})