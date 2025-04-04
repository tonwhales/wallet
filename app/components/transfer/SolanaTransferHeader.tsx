import { memo } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useTheme } from "../../engine/hooks";
import { avatarHash } from "../../utils/avatarHash";
import { avatarColors } from "../avatar/Avatar";
import { AddressInputAvatar } from "../address/AddressInputAvatar";
import { Typography } from "../styles";

export const SolanaTransferHeader = memo(({ address }: { address: string }) => {
    const theme = useTheme();
    const addressFriendly = address;
    const avatarColorHash = avatarHash(address, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

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
            <AddressInputAvatar
                size={24}
                theme={theme}
                isOwn={false}
                markContact={false}
                // hash={walletSettings?.avatar}
                friendly={address}
                avatarColor={avatarColor}
                knownWallets={{}}
                hash={null}
            // forceAvatar={!!isTargetHolders ? 'holders' : undefined}
            />
            <Text style={[{ color: theme.textPrimary, marginLeft: 6, minHeight: 24 }, Typography.medium17_24]}>
                {addressFriendly.slice(0, 4) + '...' + addressFriendly.slice(-4)}
            </Text>
        </Animated.View>
    );
});