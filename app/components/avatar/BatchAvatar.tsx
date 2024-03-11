import { memo, useMemo } from "react";
import { View } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Avatar, AvatarIcProps, avatarColors } from "./Avatar";
import { PerfView } from "../basic/PerfView";
import { WalletSettings } from "../../engine/state/walletSettings";
import { avatarHash } from "../../utils/avatarHash";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { Address, Cell } from "@ton/core";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { StoredMessage } from "../../engine/types/transactions";
import { useAccountLite, useContractMetadata } from "../../engine/hooks";
import { resolveOperation } from "../../engine/transactions/resolveOperation";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { useContractInfo } from "../../engine/hooks/metadata/useContractInfo";

export const BatchAvatar = memo(({
    message,
    size,
    icProps,
    theme,
    isTestnet,
    borderWith,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge
}: {
    message: StoredMessage,
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWith?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean
}) => {
    const addressString = message.info.type === 'internal' ? message.info.dest : null;
    const metadata = useContractMetadata(addressString);
    // const account = useAccountLite(addressString);
    // const contractInfo = useContractInfo(addressString);

    const address = useMemo(() => {
        if (!addressString) {
            return null;
        }
        try {
            return Address.parse(addressString);
        } catch (error) {
            return null;
        }
    }, [addressString]);

    if (message.info.type !== 'internal') {  // for type safety in amount
        return null;
    }

    const amount = BigInt(message.info.value || '0');
    const bodyCell = Cell.fromBoc(Buffer.from(message.body, 'base64'))[0];
    const body = parseBody(bodyCell);

    if (!address || !addressString) {
        return null;
    }

    const operation = resolveOperation({
        body: body,
        amount: amount,
        account: address,
    }, isTestnet);


    const friendlyTarget = operation.address;
    const target = Address.parse(friendlyTarget);
    // const bounceable = contractInfo?.kind !== 'wallet';
    const opAddressBounceable = target.toString({ testOnly: isTestnet });
    const verified = !!KnownJettonMasters(isTestnet)[opAddressBounceable];
    const walletSettings = walletsSettings?.[opAddressBounceable];
    const avatarColorHash = walletSettings?.color ?? avatarHash(addressString, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const spam = !!denyList[opAddressBounceable] || spamWallets.includes(addressString);
    const contact = contacts[opAddressBounceable];

    if (message.info.type !== 'internal') {
        return null;
    }

    return (
        <Avatar
            size={size}
            address={opAddressBounceable}
            id={opAddressBounceable}
            borderWith={borderWith}
            spam={spam}
            markContact={!!contact}
            icProps={icProps}
            theme={theme}
            isTestnet={isTestnet}
            backgroundColor={avatarColor}
            hash={walletSettings?.avatar}
            verified={verified}
            showSpambadge={showSpambadge}
        />
    );
});

export const BatchAvatars = memo(({
    messages,
    size,
    icProps,
    theme,
    isTestnet,
    borderColor,
    borderWith,
    backgroundColor,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge
}: {
    messages: StoredMessage[],
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWith?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean
}) => {

    if (messages.length <= 1) {
        return null;
    }

    const innerSize = size - (borderWith ?? 0) * 2;

    return (
        <PerfView style={{
            backgroundColor: borderColor ?? theme.surfaceOnElevation,
            height: size,
            width: size,
            borderRadius: Math.floor(size / 2)
        }}>
            <PerfView style={{
                height: innerSize,
                width: innerSize,
                borderRadius: Math.floor(size / 2),
                backgroundColor: backgroundColor ?? theme.backgroundPrimary,
                flexDirection: 'row',
                flexWrap: 'wrap'
            }}>
                {messages.map((message, index) => {
                    return (
                        <BatchAvatar
                            key={index}
                            message={message}
                            size={innerSize / 2}
                            icProps={icProps}
                            theme={theme}
                            isTestnet={isTestnet}
                            borderWith={borderWith}
                            walletsSettings={walletsSettings}
                            denyList={denyList}
                            contacts={contacts}
                            spamWallets={spamWallets}
                            showSpambadge={showSpambadge}
                        />
                    );
                })}
            </PerfView>
        </PerfView>
    );
});