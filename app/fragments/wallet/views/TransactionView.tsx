import * as React from 'react';
import { Address } from '@ton/core';
import { memo, useMemo } from 'react';
import { ThemeType } from '../../../engine/state/theme';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { AppState } from '../../../storage/appState';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { KnownWallet } from '../../../secure/KnownWallets';
import { avatarColors } from '../../../components/avatar/Avatar';
import { avatarHash } from '../../../utils/avatarHash';
import { TonTransaction } from '../../../engine/types';
import { t } from '../../../i18n/t';
import { getLiquidStakingAddress } from '../../../utils/KnownPools';
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';
import { isTxSPAM } from '../../../utils/spam/isTxSPAM';
import { useLedgerTransport } from '../../ledger/components/TransportContext';
import { extraCurrencyFromTransaction } from '../../../utils/extraCurrencyFromTransaction';
import { useExtraCurrencyMap } from '../../../engine/hooks/jettons/useExtraCurrencyMap';
import { fromBnWithDecimals } from '../../../utils/withDecimals';
import { TransactionItemLayout } from './TransactionItemLayout';

export const TransactionView = memo((props: {
    own: Address,
    theme: ThemeType,
    onPress: (src: TonTransaction) => void,
    onLongPress: (src: TonTransaction, formattedAddressString: string) => void,
    ledger?: boolean,
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    appState?: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings },
    knownWallets: { [key: string]: KnownWallet },
    getAddressFormat: (address: Address) => boolean | undefined,
    tx: TonTransaction,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    spamWallets: string[],
    spamMinAmount: bigint,
}) => {
    const {
        theme,
        contacts,
        isTestnet,
        knownWallets,
        own,
        bounceableFormat,
        appState,
        onPress,
        onLongPress,
        walletsSettings,
        getAddressFormat,
        tx,
        dontShowComments,
        denyList,
        spamWallets,
        spamMinAmount,
    } = props;

    const operation = tx.base.operation;
    const item = operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount
    const showAmount = absAmount >= 0n
    const contractInfo = tx.contractInfo;
    const parsed = tx.base.parsed;
    const kind = tx.base.parsed.kind;
    const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
    const parsedOpAddr = Address.parseFriendly(opAddress);
    const parsedAddress = parsedOpAddr.address;
    const parsedAddressFriendly = parsedAddress.toString({ testOnly: isTestnet });
    const parsedAddressNonBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable: false });
    const isOwn = (appState?.addresses ?? []).findIndex((a) => a.address.equals(parsedAddress)) >= 0
    const bounceable = getAddressFormat(parsedAddress) ?? (contractInfo?.kind === 'wallet' || !contractInfo || kind === 'in'
        ? bounceableFormat
        : parsedOpAddr.isBounceable)
    const walletSettings = walletsSettings[parsedAddressFriendly];
    const contact = contacts[parsedAddressFriendly] || contacts[parsedAddressNonBounceable];
    const avatarColorHash = walletSettings?.color ?? avatarHash(parsedAddressFriendly, avatarColors.length)
    const avatarColor = avatarColors[avatarColorHash];
    const parsedAddressFriendlyBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable });
    const ledgerContext = useLedgerTransport();
    const ledgerAddresses = ledgerContext?.wallets;
    const isOutgoing = kind === 'out';

    // Extra currencies
    const extraCurrency = extraCurrencyFromTransaction(tx)
    const extraCurrencyMap = useExtraCurrencyMap(extraCurrency, own.toString({ testOnly: isTestnet }));
    const extraCurrencies =
        Object.entries(extraCurrencyMap ?? {}).map(([, extraCurrency]) => {
            const amount = extraCurrency.amount;
            const symbol = extraCurrency.preview.symbol;
            const sign = isOutgoing ? '-' : '+';
            return `${sign}${fromBnWithDecimals(amount, extraCurrency.preview.decimals)} ${symbol}`;
        })

    // Operation text
    const op = useMemo(() => {
        if (operation.op) {
            const isLiquid = getLiquidStakingAddress(isTestnet).equals(parsedAddress);
            if (operation.op.res === 'known.withdraw' && isLiquid) {
                return t('known.withdrawLiquid');
            }
            return t(operation.op.res, operation.op.options);
        } else {
            if (parsed.kind === 'out' || tx.message) {
                if (parsed.status === 'pending') {
                    return t('tx.sending');
                } else {
                    return t('tx.sent');
                }
            } else if (parsed.kind === 'in') {
                if (parsed.bounced) {
                    return t('tx.bounced');
                } else {
                    return t('tx.received');
                }
            } else {
                throw Error('Unknown kind');
            }
        }
    }, [operation.op, parsed, tx.message, parsedAddress])

    const holdersOp = operation.op?.res?.startsWith('known.holders.')

    const forcedAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (holdersOp) {
            return 'holders';
        }
        if (operation.op?.res === 'known.cashback') {
            return 'cashback';
        }
        if (contractInfo?.kind === 'dedust-vault') {
            return 'dedust';
        }
        if (contractInfo?.kind === 'card' || contractInfo?.kind === 'jetton-card') {
            return 'holders';
        }
    }, [contractInfo, holdersOp, opAddress])

    const isLedgerTarget = useMemo(() => {
        return !!ledgerAddresses?.find((addr) => {
            try {
                return parsedAddress?.equals(Address.parse(addr.address));
            } catch (error) {
                return false;
            }
        });
    }, [ledgerAddresses, parsedAddress])

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallets[parsedAddressFriendly]) {
        known = knownWallets[parsedAddressFriendly];
    }
    if (!!contact) {
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    // Spam detection
    let spam = isTxSPAM(
        tx,
        {
            knownWallets,
            isDenyAddress: (addressString?: string | null) => !!denyList[addressString ?? '']?.reason,
            spamWallets,
            spamMinAmount,
            isTestnet
        }
    )

    const amountColor = !isOutgoing
        ? (spam ? theme.textPrimary : theme.accentGreen)
        : theme.textPrimary
    const showPrice = item.kind !== 'token' && tx.base.outMessagesCount <= 1 && absAmount >= 0n
    const symbolText = tx.symbolText ?? '';

    return (
        <TransactionItemLayout
            operation={op}
            parsedAddress={parsedAddress}
            addressBounceable={bounceable}
            time={tx.base.time}
            status={parsed.status}
            absAmount={absAmount}
            isOutgoing={isOutgoing}
            showAmount={showAmount}
            symbolText={symbolText}
            showMultipleMessages={tx.base.outMessagesCount > 1}
            messagesCount={tx.base.outMessagesCount}
            avatarColor={avatarColor}
            spam={spam}
            isOwn={isOwn}
            isLedger={isLedgerTarget}
            markContact={!!contact}
            forcedAvatar={forcedAvatar}
            jettonDecimals={tx.jettonDecimals || undefined}
            theme={theme}
            isTestnet={isTestnet}
            showPrice={showPrice}
            showSpamLabel={true}
            amountColor={amountColor}
            known={known}
            walletSettings={walletSettings}
            knownWallets={knownWallets}
            comment={operation.comment}
            showComment={!(spam && dontShowComments)}
            extraCurrencies={extraCurrencies}
            onPress={() => onPress(tx)}
            onLongPress={() => onLongPress(tx, parsedAddressFriendlyBounceable)}
        />
    );
})

TransactionView.displayName = 'TransactionView'; 