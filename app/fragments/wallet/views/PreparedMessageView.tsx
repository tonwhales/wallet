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
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';
import { TransactionItemLayout } from './TransactionItemLayout';
import { TonTransaction } from '../../../engine/types';

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
    const item = operation.items[0];
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
    const isTargetHolders = contractInfo?.kind === 'card' || contractInfo?.kind === 'jetton-card'
    const forcedAvatar: ForcedAvatarType | undefined = useMemo(() =>
        isTargetHolders ? 'holders' : undefined, [contractInfo, opAddress]
    );
    const symbolText = tx.symbolText ?? '';

    // Operation text
    const op = useMemo(() => {
            if (operation.op) {
                const isLiquid = getLiquidStakingAddress(isTestnet).equals(parsedAddress);
                if (operation.op.res === 'known.withdraw' && isLiquid) {
                    return t('known.withdrawLiquid');
                }
                return t(operation.op.res, operation.op.options);
            } else {
                if (status === 'pending') {
                    return t('tx.sending');
                } else {
                    return t('tx.sent');
                }
            }
        }, [operation.op, status, parsedAddress, isTestnet]
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