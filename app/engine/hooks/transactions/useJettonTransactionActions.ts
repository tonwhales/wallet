import { useCallback } from 'react';
import { Address } from '@ton/core';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNetwork } from '../network/useNetwork';
import { useAddressBookContext } from '../../AddressBookContext';
import { useKnownWallets } from '../../../secure/KnownWallets';
import { ThemeType } from '../../state/theme';
import { JettonTransfer } from './useJettonTransactions';
import { parseForwardPayloadComment } from '../../../utils/spam/isTxSPAM';
import { t } from '../../../i18n/t';
import { share } from '../../../utils/share';
import { useServerConfig } from '../useServerConfig';
import { useBounceableWalletFormat } from '../appstate';
import { useAddressFormatsHistory } from '../addressFormat/useAddressFormatsHistory';

type UseJettonTransactionActionsParams = {
    address: Address;
    theme: ThemeType;
    ledger?: boolean;
    onMarkAddressSpam: (address: string) => Promise<void>;
    onAddressContact: (address: string) => void;
    onRepeatTx: (tx: JettonTransfer, formattedAddressString: string) => void;
};

/**
 * Hook for managing Jetton transaction actions (long press action sheet)
 */
export function useJettonTransactionActions(params: UseJettonTransactionActionsParams) {
    const { address, theme, ledger, onMarkAddressSpam, onAddressContact, onRepeatTx } = params;
    
    const { isTestnet } = useNetwork();
    const { showActionSheetWithOptions } = useActionSheet();
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const knownWallets = useKnownWallets(isTestnet);
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const [bounceableFormat] = useBounceableWalletFormat();
    const { getAddressFormat } = useAddressFormatsHistory();

    return useCallback((tx: JettonTransfer) => {
        const targetAddress = Address.parse(tx.destination);
        const bounceable = getAddressFormat(targetAddress) ?? bounceableFormat;
        const targetAddressWithBounce = targetAddress.toString({ testOnly: isTestnet, bounceable });

        const target = targetAddress.toString({ testOnly: isTestnet });
        const targetNonBounceable = targetAddress.toString({ testOnly: isTestnet, bounceable: false });
        
        // Previously contacts could be created with different address formats, now it's only bounceable, 
        // but we need to check both formats to keep compatibility
        const contactAddress = addressBook.contacts[targetAddressWithBounce] 
            ? targetAddressWithBounce 
            : targetNonBounceable;
        
        const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${targetAddressWithBounce}`;
        const buffTxHash = Buffer.from(tx.trace_id, 'base64');
        const txHash = buffTxHash.toString('base64');
        const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${address.toString({ testOnly: isTestnet })}/`
            + `${tx.transaction_lt}_${encodeURIComponent(txHash)}`;
        
        const contact = addressBook.contacts[contactAddress];
        const isSpam = !!addressBook.denyList[contactAddress]?.reason;
        const kind: 'in' | 'out' = targetAddress.equals(address) ? 'in' : 'out';
        const comment = parseForwardPayloadComment(tx.forward_payload);

        const spam =
            !!spamWallets.find((i) => target === i)
            || isSpam
            || !!comment && !knownWallets[target] && !isTestnet && kind === 'in';

        const canRepeat = kind === 'out'
            && !ledger
            && !tx.custom_payload
            && !(!!tx.forward_payload && !comment);

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
                        onRepeatTx(tx, targetAddressWithBounce);
                    }
                    break;
                }
                case 5: {
                    if (canRepeat) {
                        onRepeatTx(tx, targetAddressWithBounce);
                    }
                    break;
                }
                default:
                    break;
            }
        };

        const actionSheetOptions = {
            options: [
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
        spamWallets,
        showActionSheetWithOptions,
        theme,
        bounceableFormat,
        getAddressFormat
    ]);
}

