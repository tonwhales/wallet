import { useEffect, useRef } from 'react';
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
    hideLoaderOnRefresh,
}: {
    pendingTransactions: T[];
    txsQuery: { loading: boolean; refresh: (silent?: boolean) => void };
    removePending: (ids: string[]) => void;
    hideLoaderOnRefresh?: boolean;
}) {
    // Use refs to track state without causing useEffect to recreate
    const loadingRef = useRef(txsQuery.loading);
    const refreshRef = useRef(txsQuery.refresh);
    const hideLoaderRef = useRef(hideLoaderOnRefresh);
    
    loadingRef.current = txsQuery.loading;
    refreshRef.current = txsQuery.refresh;
    hideLoaderRef.current = hideLoaderOnRefresh;

    // Remove transactions that changed status from pending after 2 seconds
    useEffect(() => {
        const toRemove = pendingTransactions.filter(tx => tx.status !== PendingTransactionStatus.Pending);
        
        if (toRemove.length === 0 || loadingRef.current) {
            return;
        }

        const timeoutId = setTimeout(() => {
            removePending(toRemove.map(tx => tx.id));
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [pendingTransactions, removePending]);

    // Auto-refresh transactions every 5 seconds if there are pending transactions
    // Use refs to avoid recreating interval on every render
    useEffect(() => {
        if (pendingTransactions.length === 0) {
            return;
        }

        const intervalId = setInterval(() => {
            // Don't start new refresh if previous one is still running
            if (!loadingRef.current) {
                refreshRef.current(hideLoaderRef.current);
            }
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [pendingTransactions.length > 0]);
}
