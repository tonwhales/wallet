import React, { memo, useCallback } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { AddressSearchItem } from "./AddressSearch";
import { Avatar, avatarColors } from "../avatar/Avatar";
import { AddressComponent } from "./AddressComponent";
import { WalletSettings } from "../../engine/state/walletSettings";
import { avatarHash } from "../../utils/avatarHash";
import { useContractInfo, useForcedAvatarType } from "../../engine/hooks";
import { KnownWallet } from "../../secure/KnownWallets";
import { ThemeType } from "../../engine/state/theme";
import { ForcedAvatar } from "../avatar/ForcedAvatar";
import { Typography } from "../styles";

export const AddressSearchItemView = memo(({
    item,
    onPress,
    walletsSettings,
    testOnly,
    theme,
    bounceableFormat,
    knownWallets
}: {
    item: AddressSearchItem,
    onPress?: (item: AddressSearchItem) => void,
    walletsSettings: { [key: string]: WalletSettings },
    testOnly: boolean,
    theme: ThemeType,
    bounceableFormat?: boolean,
    knownWallets: { [key: string]: KnownWallet }
}) => {
    const addressString = item.addr.address.toString({ testOnly });
    const contractInfo = useContractInfo(addressString);
    const known = knownWallets[addressString];

    const settings = walletsSettings[addressString];

    const avatarColorHash = settings?.color ?? avatarHash(addressString, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const bounceable = (contractInfo?.kind === 'wallet')
        ? bounceableFormat || false
        : item.addr.isBounceable

    const action = useCallback(() => {
        if (onPress) {
            onPress({ ...item, addr: { ...item.addr, isBounceable: bounceable }, known: !!known });
        }
    }, [onPress, item, known, bounceable]);

    // Use service address check as first source of truth
    const forcedAvatarType = useForcedAvatarType({
        address: addressString,
        contractInfo
    });

    // Determine avatar type: prioritize service check, then item.type === 'holders'
    const shouldUseForcedAvatar = forcedAvatarType || item.type === 'holders';
    const avatarType = forcedAvatarType || (item.type === 'holders' ? 'holders' : undefined);

    let avatar = shouldUseForcedAvatar && avatarType ? (
        <ForcedAvatar
            type={avatarType}
            size={46}
            icProps={{ position: 'right' }}
        />
    ) : (
        <Avatar
            address={addressString}
            id={addressString}
            size={46}
            borderWidth={0}
            markContact={item.type === 'contact'}
            icProps={{
                isOwn: item.type === 'own',
                backgroundColor: theme.elevation
            }}
            hash={settings?.avatar}
            theme={theme}
            knownWallets={knownWallets}
            backgroundColor={avatarColor}
            isLedger={item.isLedger}
        />
    );

    return (
        <Pressable
            onPress={action}
            style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1
            })}
        >
            <View style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    {avatar}
                </View>
                <View style={{ flexShrink: 1, justifyContent: 'center' }}>
                    <Text
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        <AddressComponent
                            bounceable={bounceable}
                            address={item.addr.address}
                            testOnly={testOnly}
                            known={!!known}
                        />
                    </Text>
                </View>
            </View>
        </Pressable>
    );
});

AddressSearchItemView.displayName = 'AddressSearchItemView';