import { memo, useMemo } from "react";
import { ThemeType } from "../../engine/state/theme";
import { Avatar, AvatarIcProps, avatarColors } from "./Avatar";
import { PerfView } from "../basic/PerfView";
import { WalletSettings } from "../../engine/state/walletSettings";
import { avatarHash } from "../../utils/avatarHash";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { Address, Cell } from "@ton/core";
import { StoredMessage } from "../../engine/types/transactions";
import { resolveOperation } from "../../engine/transactions/resolveOperation";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { SelectedAccount } from "../../engine/types";
import { KnownWallet } from "../../secure/KnownWallets";

export const BatchAvatar = memo(({
    message,
    size,
    icProps,
    theme,
    isTestnet,
    borderColor,
    borderWidth,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge,
    ownAccounts,
    knownJettonMasters,
    knownWallets
}: {
    message: StoredMessage,
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWidth?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean,
    ownAccounts: SelectedAccount[],
    knownJettonMasters: { [key: string]: any },
    knownWallets: { [key: string]: KnownWallet }
}) => {
    const addressString = message.info.type === 'internal' ? message.info.dest : null;

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

    // to get jetton destination address
    const operation = resolveOperation({
        body: body,
        amount: amount,
        account: address,
    }, isTestnet);

    const friendlyTarget = operation.address;
    const target = Address.parse(friendlyTarget);
    const opAddressBounceable = target.toString({ testOnly: isTestnet });
    const verified = !!knownJettonMasters[opAddressBounceable];
    const walletSettings = walletsSettings?.[opAddressBounceable];
    const avatarColorHash = walletSettings?.color ?? avatarHash(addressString, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const spam = !!denyList[opAddressBounceable] || spamWallets.includes(addressString);
    const contact = contacts[opAddressBounceable];
    const isOwn = !!ownAccounts.find((a) => a.address.equals(target));

    return (
        <Avatar
            size={size}
            address={opAddressBounceable}
            id={opAddressBounceable}
            borderWidth={borderWidth}
            borderColor={borderColor}
            spam={spam}
            markContact={!!contact}
            icProps={{ ...icProps, isOwn }}
            theme={theme}
            backgroundColor={avatarColor}
            hash={walletSettings?.avatar}
            verified={verified}
            showSpambadge={showSpambadge}
            knownWallets={knownWallets}
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
    borderWidth,
    backgroundColor,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge,
    ownAccounts,
    knownJettonMasters,
    knownWallets
}: {
    messages: StoredMessage[],
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWidth?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean,
    ownAccounts: SelectedAccount[],
    knownJettonMasters: { [key: string]: any },
    knownWallets: { [key: string]: KnownWallet }
}) => {

    if (messages.length <= 1) {
        return null;
    }

    const innerSize = size - (borderWidth ?? 2);
    let avatarSizeCoefficient = 2;
    if (messages.length === 3) {
        avatarSizeCoefficient = 2.3;
    } else if (messages.length === 4) {
        avatarSizeCoefficient = 2.6;
    }
    const avatarSize = (innerSize) / avatarSizeCoefficient;

    return (
        <PerfView style={{
            backgroundColor: borderColor ?? theme.surfaceOnElevation,
            height: size,
            width: size,
            borderRadius: size,
            justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
        }}>
            <PerfView style={{
                height: innerSize,
                width: innerSize,
                borderRadius: innerSize / 2,
                overflow: 'hidden',
                backgroundColor: backgroundColor ?? theme.backgroundPrimary,
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
                alignItems: 'center', justifyContent: 'center', alignContent: 'center',
                paddingTop: messages.length === 3 ? size * 0.07 : 0
            }}>
                {messages.length === 2 ? (
                    <>
                        <PerfView style={{ position: 'absolute', left: '10%', top: '10%' }}>
                            <BatchAvatar
                                key={`batch-avatar-${0}`}
                                message={messages[0]}
                                size={avatarSize}
                                icProps={icProps}
                                theme={theme}
                                isTestnet={isTestnet}
                                borderWidth={0}
                                walletsSettings={walletsSettings}
                                denyList={denyList}
                                contacts={contacts}
                                spamWallets={spamWallets}
                                showSpambadge={showSpambadge}
                                ownAccounts={ownAccounts}
                                knownJettonMasters={knownJettonMasters}
                                knownWallets={knownWallets}
                            />
                        </PerfView>
                        <PerfView style={{ position: 'absolute', right: '10%', bottom: '10%' }}>
                            <BatchAvatar
                                key={`batch-avatar-${1}`}
                                message={messages[1]}
                                size={avatarSize}
                                icProps={icProps}
                                theme={theme}
                                isTestnet={isTestnet}
                                walletsSettings={walletsSettings}
                                denyList={denyList}
                                contacts={contacts}
                                spamWallets={spamWallets}
                                showSpambadge={showSpambadge}
                                ownAccounts={ownAccounts}
                                borderColor={backgroundColor ?? theme.backgroundPrimary}
                                borderWidth={1}
                                knownJettonMasters={knownJettonMasters}
                                knownWallets={knownWallets}
                            />
                        </PerfView>
                    </>
                ) :
                    (
                        messages.map((message, index) => {
                            return (
                                <PerfView style={{ marginTop: messages.length === 3 ? -size * 0.056 : 0 }}>
                                    <BatchAvatar
                                        key={`batch-avatar-${index}`}
                                        message={message}
                                        size={avatarSize}
                                        icProps={icProps}
                                        theme={theme}
                                        isTestnet={isTestnet}
                                        borderWidth={0}
                                        walletsSettings={walletsSettings}
                                        denyList={denyList}
                                        contacts={contacts}
                                        spamWallets={spamWallets}
                                        showSpambadge={showSpambadge}
                                        ownAccounts={ownAccounts}
                                        knownJettonMasters={knownJettonMasters}
                                        knownWallets={knownWallets}
                                    />
                                </PerfView>
                            );
                        })
                    )}
            </PerfView>
        </PerfView>
    );
});