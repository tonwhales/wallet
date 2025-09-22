import { useMemo } from 'react';
import { Address } from '@ton/core';
import { TransactionType } from '../../types';
import { useAccountTransactionsV2 } from './useAccountTransactionsV2';
import { usePendingActions } from '..';
import { UnifiedTonTransaction, createUnifiedTonTransaction, createUnifiedPendingTonTransaction } from '../../types/unifiedTransaction';
import { usePendingTransactionEffects } from './usePendingTransactionEffects';
import { filterTransactionsBeforeEarliestPending } from './transactionFilters';

export function useUnifiedTransactions(address: Address, isTestnet: boolean) {
    const txsQuery = useAccountTransactionsV2(
        address.toString({ testOnly: isTestnet }),
        { refetchOnMount: true },
        { type: TransactionType.TON }
    );
    const { state: pending, removePending, markAsSent, markAsTimedOut } = usePendingActions(address.toString({ testOnly: isTestnet }), isTestnet);

    usePendingTransactionEffects({
        pendingTransactions: pending,
        txsQuery,
        removePending,
        hideLoaderOnRefresh: true
    });

    const { unifiedTransactions, pendingCount } = useMemo(() => {
        const blockchainTxs: UnifiedTonTransaction[] = (txsQuery.data ?? []).map(createUnifiedTonTransaction);
        const pendingTxs: UnifiedTonTransaction[] = pending.map(createUnifiedPendingTonTransaction);

        // Show only blockchain transactions that were BEFORE the earliest pending
        const filteredBlockchainTxs = filterTransactionsBeforeEarliestPending(blockchainTxs, pending);

        const allTxs = [...pendingTxs, ...filteredBlockchainTxs];

        return {
            unifiedTransactions: allTxs,
            pendingCount: pendingTxs.length
        };
    }, [txsQuery.data?.length, txsQuery.data?.[0]?.hash, pending]);

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
