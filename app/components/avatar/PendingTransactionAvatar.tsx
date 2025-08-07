import React, { memo } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { avatarHash } from "../../utils/avatarHash";
import { Avatar, avatarColors } from "./Avatar";
import { KnownWallet } from "../../secure/KnownWallets";
import { useTheme, useWalletSettings } from "../../engine/hooks";
import { ForcedAvatar, ForcedAvatarType } from "./ForcedAvatar";
import { PendingIcon } from "./PendingIcon";

const Color = require('color');

export const PendingTransactionAvatar = memo(({
    style,
    avatarId,
    address,
    kind,
    knownWallets,
    forceAvatar,
    isLedger
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string,
    address?: string,
    kind: 'in' | 'out',
    knownWallets: { [key: string]: KnownWallet },
    forceAvatar?: ForcedAvatarType
    isLedger?: boolean
}) => {
    const theme = useTheme();
    const [walletSettings] = useWalletSettings(address);
    const avatarColorHash = walletSettings?.color ?? avatarHash(avatarId, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    let known = address ? knownWallets[address] : undefined;
    let lighter = Color(avatarColor).lighten(0.4).hex();
    let darker = Color(avatarColor).lighten(0.2).hex();

    if (known && known.colors) {
        lighter = known.colors.primary;
        darker = known.colors.secondary;
    }

    return (
        <View style={[{ flex: 1, height: 46, width: 46, justifyContent: 'center', alignItems: 'center' }, style]}>
            <View style={{
                position: 'absolute',
                top: 0, left: 0,
                right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!!forceAvatar ? (
                    <ForcedAvatar type={forceAvatar} size={46} hideVerifIcon />
                ) : (
                    <Avatar
                        address={address}
                        size={46}
                        id={avatarId}
                        hash={walletSettings.avatar}
                        borderWidth={0}
                        backgroundColor={avatarColor}
                        theme={theme}
                        knownWallets={knownWallets}
                        isLedger={isLedger}
                    />
                )}
            </View>
            <PendingIcon 
                borderColor={(style as ViewStyle)?.backgroundColor ?? theme.surfaceOnElevation}
            />
        </View>
    )
})