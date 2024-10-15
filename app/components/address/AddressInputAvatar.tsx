import { memo } from "react";
import { Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Avatar } from "../avatar/Avatar";
import { KnownWallet } from "../../secure/KnownWallets";
import { ForcedAvatar, ForcedAvatarType } from "../avatar/ForcedAvatar";

export const AddressInputAvatar = memo(({
    size,
    theme,
    isTestnet,
    friendly,
    isOwn,
    markContact,
    hash,
    isLedger,
    avatarColor,
    knownWallets,
    forceAvatar
}: {
    size: number,
    theme: ThemeType,
    isTestnet: boolean,
    friendly?: string,
    isOwn: boolean,
    markContact: boolean,
    hash: number | null
    isLedger?: boolean,
    avatarColor: string,
    knownWallets: { [key: string]: KnownWallet },
    forceAvatar?: ForcedAvatarType
}) => {

    if (forceAvatar) {
        return (
            <ForcedAvatar
                type={forceAvatar}
                size={size}
                icProps={{ isOwn }}
            />
        );
    }


    if (isLedger) {
        return (
            <Image
                source={require('@assets/ledger_device.png')}
                style={{ height: size, width: size }}
            />
        );
    }

    if (friendly) {
        return (
            <Avatar
                size={size}
                id={friendly}
                address={friendly}
                borderColor={theme.elevation}
                theme={theme}
                hash={hash}
                knownWallets={knownWallets}
                backgroundColor={avatarColor}
                markContact={markContact}
                icProps={{ isOwn }}
            />
        );
    }

    return (
        <Image
            source={require('@assets/ic-contact.png')}
            style={{ height: size, width: size, tintColor: theme.iconPrimary }}
        />
    );
});

AddressInputAvatar.displayName = 'AddressInputAvatar';