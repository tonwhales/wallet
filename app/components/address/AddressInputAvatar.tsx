import { memo } from "react";
import { Avatar } from "../Avatar";
import { Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";


export const AddressInputAvatar = memo(({
    size,
    theme,
    isTestnet,
    friendly,
    isOwn,
    markContact,
    hash,
    isLedger,
    avatarColor
}: {
    size: number,
    theme: ThemeType,
    isTestnet: boolean,
    friendly?: string,
    isOwn: boolean,
    markContact: boolean,
    hash: number | null
    isLedger?: boolean,
    avatarColor: string
}) => {
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
                isTestnet={isTestnet}
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