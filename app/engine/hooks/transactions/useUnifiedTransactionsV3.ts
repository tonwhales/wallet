import { useMemo } from 'react';
import { TransactionType } from '../../types';
import { UnifiedTonTransaction, createUnifiedTonTransaction, createUnifiedPendingTonTransaction, createUnifiedSolanaTransaction, UnifiedSolanaTransaction, createUnifiedPendingSolanaTransaction } from '../../types/unifiedTransaction';
import { filterTransactionsBeforeEarliestPending } from './transactionFilters';
import { useAccountTransactionsV3 } from './useAccountTransactionsV3';
import { useCommonPendingActions } from './useCommonPendingActions';

export function useUnifiedTransactionsV3() {
    const txsQuery = useAccountTransactionsV3(
        { refetchOnMount: true },
    );
    const { tonPending, solanaPending, markAsSent, markAsTimedOut } = useCommonPendingActions();

    const { unifiedTransactions, pendingCount } = useMemo(() => {
        const blockchainTxs: (UnifiedTonTransaction | UnifiedSolanaTransaction)[] = (txsQuery.data ?? []).map(
            (tx) => {
                if (tx.type === TransactionType.TON) {
                    return createUnifiedTonTransaction(tx.data);
                } else {
                    return createUnifiedSolanaTransaction(tx.data);
                }
            }
        );
        const tonPendingTxs: UnifiedTonTransaction[] = tonPending.map(createUnifiedPendingTonTransaction);
        const solanaPendingTxs: UnifiedSolanaTransaction[] = solanaPending.map(createUnifiedPendingSolanaTransaction);

        // Step 1: Filter blockchain transactions for TON pending
        const filteredAfterTon = filterTransactionsBeforeEarliestPending(blockchainTxs, tonPending);
        
        // Step 2: Filter remaining blockchain transactions for Solana pending (includes signature matching)
        const filteredBlockchainTxs = solanaPendingTxs.length > 0
            ? filteredAfterTon.filter(blockchainTx => {
                // Hide blockchain transactions that match pending transaction IDs (signatures)
                const matchesPendingSignature = solanaPendingTxs.some((pendingTx: UnifiedSolanaTransaction) =>
                    pendingTx.id === blockchainTx.id
                );

                if (matchesPendingSignature) {
                    return false; // Hide blockchain transaction if it matches a pending one
                }

                // Show only blockchain transactions that were BEFORE the earliest pending
                const earliestPendingTime = Math.min(...solanaPendingTxs.map(tx => tx.time));
                return blockchainTx.time < earliestPendingTime;
            })
            : filteredAfterTon;
        
        const allTxs = [...tonPendingTxs, ...solanaPendingTxs, ...filteredBlockchainTxs];

        return {
            unifiedTransactions: allTxs,
            pendingCount: tonPendingTxs.length + solanaPendingTxs.length
        };
    }, [
        txsQuery.data?.length,
        txsQuery.data && txsQuery.data[0]
            ? (txsQuery.data[0].type === TransactionType.TON ? txsQuery.data[0].data?.hash : txsQuery.data[0].data?.signature)
            : null,
        tonPending,
        solanaPending
    ]);

    return {
        transactions: unifiedTransactions,
        pendingCount,
        loading: txsQuery.loading,
        refreshing: txsQuery.refreshing,
        hasNext: txsQuery.hasNext,
        next: txsQuery.next,
        refresh: txsQuery.refresh,
        markAsSent,
        markAsTimedOut
    };
}
