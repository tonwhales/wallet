import * as React from 'react';
import { Address } from '@ton/core';
import { useMemo } from 'react';
import { ThemeType } from '../../../engine/state/theme';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { AppState } from '../../../storage/appState';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { KnownWallet } from '../../../secure/KnownWallets';
import { avatarColors } from '../../../components/avatar/Avatar';
import { avatarHash } from '../../../utils/avatarHash';
import { t } from '../../../i18n/t';
import { getLiquidStakingAddress } from '../../../utils/KnownPools';
import { TransactionItemLayout } from './TransactionItemLayout';
import { TonTransaction } from '../../../engine/types';
import { useForcedAvatarType } from '../../../engine/hooks';

/**
 * Render a prepared TON transaction message row with resolved address, avatar, known-wallet/contact and human-readable operation text.
 *
 * Resolves display metadata for the provided transaction (address formatting, avatar color/type, known wallet/contact, operation label, amounts, and other flags) and returns a TransactionItemLayout preconfigured for that transaction.
 *
 * @param tx - The TON transaction to display.
 * @param onPress - Called with `tx` when the item is pressed.
 * @param onLongPress - Called with `tx` (and an optional formatted address string) when the item is long-pressed.
 * @param ledger - If true, mark the item as related to a Ledger device.
 * @returns A JSX element representing the prepared transaction item row.
 */
export function PreparedMessageView(props: {
    tx: TonTransaction,
    own: Address,
    theme: ThemeType,
    onPress: (src: TonTransaction) => void,
    onLongPress: (src: TonTransaction, formattedAddressString?: string) => void,
    ledger?: boolean,
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    appState?: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings },
    knownWallets: { [key: string]: KnownWallet },
    getAddressFormat: (address: Address) => boolean | undefined,
}) {
    const {
        tx,
        theme,
        contacts,
        isTestnet,
        walletsSettings,
        appState,
        bounceableFormat,
        ledger,
        onPress,
        onLongPress,
        knownWallets,
        getAddressFormat,
    } = props;

    const message = tx.message!;
    const status = tx.base.parsed.status;
    const time = tx.base.time;
    const contractInfo = tx.contractInfo;
    const operation = message.operation;
    // If items[0] is a token but jettonMaster is not found (for example, swap on DEX), use items[1] (TON)
    const item = operation.items[0].kind === 'token' && !message.jettonMaster && operation.items.length > 1
        ? operation.items[1]
        : operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount
    const showAmount = absAmount >= 0n
    const opAddress = item.kind === 'token' ? operation.address : message.friendlyTarget;
    const parsedOpAddr = Address.parseFriendly(opAddress)
    const parsedAddress = parsedOpAddr.address;
    const parsedAddressFriendly = parsedAddress.toString({ testOnly: isTestnet });
    const parsedAddressNonBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable: false });
    const isOwn = (appState?.addresses ?? []).findIndex((a) => a.address.equals(parsedAddress)) >= 0
    const bounceable = getAddressFormat(parsedAddress) ?? (contractInfo?.kind === 'wallet' || !contractInfo
        ? bounceableFormat
        : parsedOpAddr.isBounceable)
    const walletSettings = walletsSettings[parsedAddressFriendly];
    const contact = contacts[parsedAddressFriendly] || contacts[parsedAddressNonBounceable];
    const avatarColorHash = walletSettings?.color ?? avatarHash(parsedAddressFriendly, avatarColors.length)
    const avatarColor = avatarColors[avatarColorHash];
    const forcedAvatar = useForcedAvatarType({
        address: opAddress,
        contractInfo
    });
    const symbolText = tx.symbolText ?? '';

    // Operation text
    const op = useMemo(() => {
        if (operation.op) {
            const isLiquid = getLiquidStakingAddress(isTestnet).equals(parsedAddress);
            if (operation.op.res === 'known.withdraw' && isLiquid) {
                return t('known.withdrawLiquid');
            }
            // If this is tx.tokenTransfer but jettonMaster is not found (for example, swap on DEX), use standard text
            if (operation.op.res === 'tx.tokenTransfer' && !message.jettonMaster) {
                if (status === 'pending') {
                    return t('tx.sending');
                } else {
                    return t('tx.sent');
                }
            }
            return t(operation.op.res, operation.op.options);
        } else {
            if (status === 'pending') {
                return t('tx.sending');
            } else {
                return t('tx.sent');
            }
        }
    }, [operation.op, status, parsedAddress, isTestnet, message.jettonMaster]
    );

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = knownWallets[parsedAddressFriendly];
    if (!!contact && !known) {
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    const result = (
        <TransactionItemLayout
            operation={op}
            parsedAddress={parsedAddress}
            addressBounceable={bounceable}
            time={time}
            status={status}
            absAmount={absAmount}
            isOutgoing={true}
            showAmount={showAmount}
            symbolText={symbolText}
            avatarColor={avatarColor}
            spam={false}
            isOwn={isOwn}
            isLedger={ledger}
            markContact={!!contact}
            forcedAvatar={forcedAvatar}
            jettonDecimals={message.jettonMaster?.decimals || undefined}
            theme={theme}
            isTestnet={isTestnet}
            showPrice={item.kind !== 'token'}
            showSpamLabel={false}
            amountColor={theme.textPrimary}
            pricePrefix="-"
            known={known}
            walletSettings={walletSettings}
            knownWallets={knownWallets}
            comment={operation.comment}
            showComment={true}
            extraCurrencies={[]}
            onPress={() => onPress(tx)}
            onLongPress={() => onLongPress(tx)}
        />
    );

    return result;
}

PreparedMessageView.displayName = 'PreparedMessageView'; 