import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { Avatar } from "../../../components/avatar/Avatar";
import { KnownWallet } from "../../../secure/KnownWallets";
import { ForcedAvatar, ForcedAvatarType } from "../../../components/avatar/ForcedAvatar";

export const TxAvatar = memo((
    {
        status,
        parsedAddressFriendly,
        kind,
        spam,
        isOwn,
        theme,
        walletSettings,
        markContact,
        avatarColor,
        knownWallets,
        forceAvatar,
        verified,
        isLedger
    }: {
        status: "failed" | "pending" | "success",
        parsedAddressFriendly: string,
        kind: "in" | "out",
        spam: boolean,
        isOwn: boolean,
        theme: ThemeType,
        walletSettings?: WalletSettings,
        markContact?: boolean,
        avatarColor: string,
        knownWallets: { [key: string]: KnownWallet },
        forceAvatar?: ForcedAvatarType,
        verified?: boolean,
        isLedger?: boolean
    }
) => {

    if (status === "pending") {
        return (
            <PendingTransactionAvatar
                kind={kind}
                address={parsedAddressFriendly}
                avatarId={parsedAddressFriendly}
                theme={theme}
                knownWallets={knownWallets}
                forceAvatar={forceAvatar}
                isLedger={isLedger}
            />
        );
    }

    if (forceAvatar) {
        return (
            <ForcedAvatar
                type={forceAvatar}
                size={48}
                icProps={{
                    isOwn,
                    backgroundColor: theme.backgroundPrimary,
                    size: 18,
                    borderWidth: 2
                }}
            />
        );
    }

    return (
        <Avatar
            size={48}
            address={parsedAddressFriendly}
            id={parsedAddressFriendly}
            borderWidth={0}
            spam={spam}
            markContact={markContact}
            icProps={{
                isOwn,
                backgroundColor: theme.backgroundPrimary,
                size: 18,
                borderWidth: 2
            }}
            theme={theme}
            knownWallets={knownWallets}
            backgroundColor={avatarColor}
            hash={walletSettings?.avatar}
            verified={verified}
            isLedger={isLedger}
        />
    );
});