import { useCallback } from 'react';
import { toNano } from '@ton/core';
import { useNetwork } from '../network/useNetwork';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { JettonTransfer } from './useJettonTransactions';
import { parseForwardPayloadComment } from '../../../utils/spam/isTxSPAM';
import { fromBnWithDecimals } from '../../../utils/withDecimals';
import { Jetton } from '../../types';

/**
 * Hook for repeating Jetton transaction
 * @param jetton - jetton token information
 * @returns function to repeat transaction
 */
export function useRepeatJettonTransaction(jetton: Jetton) {
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();

    return useCallback((tx: JettonTransfer, formattedAddressString: string) => {
        const decimals = jetton.decimals ?? 9;
        const amount = toNano(fromBnWithDecimals(BigInt(tx.amount), decimals));
        const comment = parseForwardPayloadComment(tx.forward_payload);

        navigation.navigateSimpleTransfer({
            target: formattedAddressString,
            comment: comment,
            amount: amount < 0n ? -amount : amount,
            stateInit: null,
            asset: { type: 'jetton', master: jetton.master, wallet: jetton.wallet },
            callback: null
        });
    }, [navigation, isTestnet, jetton]);
}

