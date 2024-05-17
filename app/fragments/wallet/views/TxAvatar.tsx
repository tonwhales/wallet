import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { Avatar } from "../../../components/avatar/Avatar";
import { KnownWallet } from "../../../secure/KnownWallets";
import { Image } from "react-native";

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
        isHolders
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
        isHolders?: boolean
    }
) => {

    if (isHolders) {
        return <Image
            source={require('@assets/ic-holders-accounts.png')}
            style={{ width: 46, height: 46, borderRadius: 23 }}
        />;
    }

    if (status === "pending") {
        return (
            <PendingTransactionAvatar
                kind={kind}
                address={parsedAddressFriendly}
                avatarId={parsedAddressFriendly}
                theme={theme}
                knownWallets={knownWallets}
            />
        );
    }

    return (
        <Avatar
            size={48}
            address={parsedAddressFriendly}
            id={parsedAddressFriendly}
            borderWith={0}
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
        />
    );
});