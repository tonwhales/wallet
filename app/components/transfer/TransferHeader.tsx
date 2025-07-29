import { memo } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { ThemeType } from "../../engine/state/theme";
import { Avatar, avatarColors } from "../avatar/Avatar";
import { useContractInfo, useWalletSettings } from "../../engine/hooks";
import { avatarHash } from "../../utils/avatarHash";
import { Address } from "@ton/core";
import { Typography } from "../styles";
import { KnownWallet } from "../../secure/KnownWallets";

export const TransferHeader = memo(({
    theme,
    isTestnet,
    address,
    bounceable,
    knownWallets,
    isLedger
}: {
    theme: ThemeType,
    isTestnet: boolean,
    address: Address,
    bounceable?: boolean,
    knownWallets: { [key: string]: KnownWallet },
    isLedger: boolean
}) => {
    const addressKey = address.toString({ testOnly: isTestnet });
    const addressFriendly = address.toString({ testOnly: isTestnet, bounceable });
    const [walletSettings,] = useWalletSettings(addressKey);
    const avatarColorHash = walletSettings?.color ?? avatarHash(addressKey, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const targetContract = useContractInfo(addressKey);
    const isTargetHolders = targetContract?.kind === 'card' || targetContract?.kind === 'jetton-card'
    const forcedAvatar = isTargetHolders ? 'holders' : undefined;

    return (
        <Animated.View
            entering={FadeInDown} exiting={FadeOutDown}
            style={{
                backgroundColor: theme.border,
                borderRadius: 100,
                maxWidth: '70%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: -16,
                paddingLeft: 6, paddingRight: 12,
                paddingVertical: 6
            }}
        >
            <Avatar
                size={24}
                id={addressKey}
                address={addressKey}
                borderWidth={0}
                theme={theme}
                hash={walletSettings?.avatar}
                backgroundColor={avatarColor}
                knownWallets={knownWallets}
                isLedger={isLedger}
                forcedAvatar={forcedAvatar}
            />
            <Text style={[{ color: theme.textPrimary, marginLeft: 6, minHeight: 24 }, Typography.medium17_24]}>
                {addressFriendly.slice(0, 4) + '...' + addressFriendly.slice(-4)}
            </Text>
        </Animated.View>
    );
});