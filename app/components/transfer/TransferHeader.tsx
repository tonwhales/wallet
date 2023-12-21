import { memo } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { ThemeType } from "../../engine/state/theme";
import { Avatar } from "../Avatar";
import { useWalletSettings } from "../../engine/hooks";

export const TransferHeader = memo(({ theme, isTestnet, addressFriendly }: { theme: ThemeType, isTestnet: boolean, addressFriendly: string }) => {
    const [walletSettings,] = useWalletSettings(addressFriendly);

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
                id={addressFriendly}
                address={addressFriendly}
                borderWith={0}
                theme={theme}
                isTestnet={isTestnet}
                hash={walletSettings?.avatar}
            />
            <Text style={{
                fontSize: 17, lineHeight: 24,
                color: theme.textPrimary,
                fontWeight: '500',
                marginLeft: 6,
                minHeight: 24
            }}>
                {addressFriendly.slice(0, 4) + '...' + addressFriendly.slice(-4)}
            </Text>
        </Animated.View>
    )
})