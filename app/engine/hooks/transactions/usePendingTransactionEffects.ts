import { useEffect } from 'react';
import { PendingTransactionStatus } from '../../state/pending';

/**
 * Common logic for handling TON, Jetton, Solana, Solana token pending transactions:
 * - Remove pending transactions with changed status after 2 seconds
 * - Auto-refresh transactions every 5 seconds if there are pending transactions
 */
export function usePendingTransactionEffects<T extends { status: PendingTransactionStatus, id: string }>({
    pendingTransactions,
    txsQuery,
    removePending,
    hideLoaderOnRefresh
}: {
    pendingTransactions: T[];
    txsQuery: { loading: boolean; refresh: (silent?: boolean) => void };
    removePending: (ids: string[]) => void;
    hideLoaderOnRefresh?: boolean;
}) {
    // Remove transactions that changed status from pending after 2 seconds
    useEffect(() => {
        const toRemove = pendingTransactions.filter(tx => tx.status !== PendingTransactionStatus.Pending);
        
        if (toRemove.length === 0 || txsQuery.loading) {
            return;
        }

        const timeoutId = setTimeout(() => {
            removePending(toRemove.map(tx => tx.id));
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [pendingTransactions, txsQuery.loading, removePending]);

    // Auto-refresh transactions every 5 seconds if there are pending transactions
    useEffect(() => {
        if (pendingTransactions.length === 0) {
            return;
        }

        const intervalId = setInterval(() => {
            txsQuery.refresh(hideLoaderOnRefresh);
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [pendingTransactions.length > 0, txsQuery.refresh]);
}
