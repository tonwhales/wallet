import { useCallback } from 'react';
import { Address } from '@ton/core';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { TonTransaction } from '../../types';
import { useNetwork } from '../network/useNetwork';
import { useAddressBookContext } from '../../AddressBookContext';
import { useKnownWallets } from '../../../secure/KnownWallets';
import { ThemeType } from '../../state/theme';
import { t } from '../../../i18n/t';
import { share } from '../../../utils/share';
import { useSpamMinAmount } from '../spam/useSpamMinAmount';
import { useServerConfig } from '../useServerConfig';

type UseTonTransactionActionsParams = {
    address: Address;
    theme: ThemeType;
    ledger?: boolean;
    onMarkAddressSpam: (address: string) => Promise<void>;
    onAddressContact: (address: string) => void;
    onRepeatTx: (tx: TonTransaction, formattedAddressString: string) => void;
};

/**
 * Hook for managing TON transaction actions (long press action sheet)
 */
export function useTonTransactionActions(params: UseTonTransactionActionsParams) {
    const { address, theme, ledger, onMarkAddressSpam, onAddressContact, onRepeatTx } = params;
    
    const { isTestnet } = useNetwork();
    const { showActionSheetWithOptions } = useActionSheet();
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const knownWallets = useKnownWallets(isTestnet);
    const [spamMinAmount] = useSpamMinAmount();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];

    return useCallback((tx: TonTransaction, formattedAddressString?: string) => {
        const operation = tx.base.operation;
        
        // If items[0] is a token but jettonDecimals is not set (for example, swap on DEX), use items[1] (TON)
        const item = operation.items[0].kind === 'token' && !tx.jettonDecimals && operation.items.length > 1
            ? operation.items[1]
            : operation.items[0];
        
        const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const opAddressFriendly = Address.parseFriendly(opAddress);
        const opAddressInAnotherFormat = opAddressFriendly.address.toString({ 
            testOnly: isTestnet, 
            bounceable: !opAddressFriendly.isBounceable 
        });
        
        // Previously contacts could be created with different address formats, now it's only bounceable, 
        // but we need to check both formats to keep compatibility
        const contactAddress = addressBook.contacts[opAddress] ? opAddress : opAddressInAnotherFormat;
        const contact = addressBook.contacts[contactAddress];
        const isSpam = !!addressBook.denyList[contactAddress]?.reason;
        const kind = tx.base.parsed.kind;
        
        const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${formattedAddressString}`;
        const txId = `${tx.base.lt}_${tx.base.hash}`;
        const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${address.toString({ testOnly: isTestnet })}/`
            + `${txId}`;
        
        const itemAmount = BigInt(item.amount);
        const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;

        const spam =
            !!spamWallets.find((i) => opAddress === i)
            || isSpam
            || (
                absAmount < spamMinAmount
                && !!tx.base.operation.comment
                && !knownWallets[opAddress]
                && !isTestnet
            ) && kind !== 'out';

        const canRepeat = kind === 'out'
            && !ledger
            && tx.base.parsed.body?.type !== 'payload'
            && !!formattedAddressString;

        const handleAction = (eN?: number) => {
            switch (eN) {
                case 1: {
                    if (explorerTxLink) {
                        share(explorerTxLink, t('txActions.share.transaction'));
                    }
                    break;
                }
                case 2: {
                    onAddressContact(contactAddress);
                    break;
                }
                case 3: {
                    share(addressLink, t('txActions.share.address'));
                    break;
                }
                case 4: {
                    if (!spam) {
                        onMarkAddressSpam(contactAddress);
                    } else if (canRepeat) {
                        onRepeatTx(tx, formattedAddressString);
                    }
                    break;
                }
                case 5: {
                    if (canRepeat) {
                        onRepeatTx(tx, formattedAddressString);
                    }
                    break;
                }
                default:
                    break;
            }
        };

        const actionSheetOptions = {
            options: tx.base.outMessagesCount > 1 ? [
                t('common.cancel'),
                t('txActions.txShare'),
            ] : [
                t('common.cancel'),
                t('txActions.txShare'),
                !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'),
                t('txActions.addressShare'),
                ...(!spam ? [t('txActions.addressMarkSpam')] : []),
                ...(canRepeat ? [t('txActions.txRepeat')] : []),
            ],
            userInterfaceStyle: theme.style,
            cancelButtonIndex: 0,
            destructiveButtonIndex: !spam ? 4 : undefined,
        };

        return showActionSheetWithOptions(actionSheetOptions, handleAction);
    }, [
        address,
        addressBook,
        isTestnet,
        knownWallets,
        onAddressContact,
        onMarkAddressSpam,
        onRepeatTx,
        ledger,
        spamMinAmount,
        spamWallets,
        showActionSheetWithOptions,
        theme
    ]);
}

