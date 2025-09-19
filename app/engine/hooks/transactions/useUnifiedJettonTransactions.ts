import { useMemo } from 'react';
import { Address } from '@ton/core';
import { useNetwork } from '../network/useNetwork';
import { usePendingActions } from './usePendingActions';
import { useJettonTransactions } from './useJettonTransactions';
import { 
    UnifiedJettonTransaction, 
    createUnifiedJettonTransaction, 
    createUnifiedPendingJettonTransaction 
} from '../../types/unifiedTransaction';
import { PendingTransaction } from '../../state/pending';
import { usePendingTransactionEffects } from './usePendingTransactionEffects';
import { filterTransactionsBeforeEarliestPending } from './transactionFilters';

export function useUnifiedJettonTransactions(owner: string, master: string) {
    const { isTestnet } = useNetwork();
    const address = Address.parse(owner);
    const txsQuery = useJettonTransactions(owner, master, { refetchOnMount: true });
    const { state: pending, removePending, markAsSent, markAsTimedOut } = usePendingActions(address.toString({ testOnly: isTestnet }), isTestnet, txsQuery.refresh);

    // Filter pending transactions for this specific jetton
    const jettonPending = useMemo(() => {
        return pending.filter((tx: PendingTransaction) => {
            // Check if this pending transaction is for the current jetton
            if (tx.body?.type === 'token') {
                try {
                    const txJettonMaster = tx.body.jetton.master;
                    const currentMaster = Address.parse(master);
                    return txJettonMaster.equals(currentMaster);
                } catch {
                    return false;
                }
            }
            return false;
        });
    }, [pending, master]);

    usePendingTransactionEffects({
        pendingTransactions: jettonPending,
        txsQuery,
        removePending
    });
    
    const { unifiedTransactions, pendingCount } = useMemo(() => {
        const blockchainTxs: UnifiedJettonTransaction[] = (txsQuery.data?.flat() ?? []).map(createUnifiedJettonTransaction);
        const pendingTxs: UnifiedJettonTransaction[] = jettonPending.map(createUnifiedPendingJettonTransaction);
        
        // Show only blockchain transactions that were BEFORE the earliest pending
        const filteredBlockchainTxs = filterTransactionsBeforeEarliestPending(blockchainTxs, jettonPending);
        
        const allTxs = [...pendingTxs, ...filteredBlockchainTxs];
        
        return {
            unifiedTransactions: allTxs,
            pendingCount: pendingTxs.length
        };
    }, [txsQuery.data?.length, txsQuery.data?.[0]?.transaction_hash, jettonPending]);
    
    return {
        transactions: unifiedTransactions,
        pendingCount,
        hasNext: txsQuery.hasNext,
        loading: txsQuery.loading,
        next: txsQuery.next,
        refresh: txsQuery.refresh,
        markAsSent,
        markAsTimedOut
    };
}
