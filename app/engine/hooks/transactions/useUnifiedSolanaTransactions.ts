import { useMemo } from 'react';
import { usePendingSolanaActions } from './usePendingSolanaActions';
import { useSolanaTransactions } from '../solana/useSolanaTransactions';
import { useSolanaTokenTransactions } from '../solana/useSolanaTokenTransactions';
import { 
    UnifiedSolanaTransaction, 
    createUnifiedSolanaTransaction, 
    createUnifiedPendingSolanaTransaction 
} from '../../types/unifiedTransaction';
import { PendingSolanaTransaction } from '../../state/pending';
import { usePendingTransactionEffects } from './usePendingTransactionEffects';

export function useUnifiedSolanaTransactions(address: string, mint?: string) {
    const nativeTxsQuery = useSolanaTransactions(address, !mint); // Enable for native SOL wallet
    const tokenTxsQuery = useSolanaTokenTransactions(address, mint, !!mint); // Enable for token wallet
    const txsQuery = mint ? tokenTxsQuery : nativeTxsQuery;
    const { state: pending, remove: removePending } = usePendingSolanaActions(address, mint);

    // Filter pending transactions for this specific token (if mint is provided)
    const filteredPending = useMemo(() => {
        if (!mint) {
            // For main wallet, show all pending transactions
            return pending;
        }
        
        return pending.filter((tx: PendingSolanaTransaction) => {
            // For token wallet, filter by mint
            if (tx.type === 'tx' && tx.tx.token?.mint) {
                return tx.tx.token.mint === mint;
            }
            // If no mint in pending tx, it's a native SOL transaction
            return false;
        });
    }, [pending, mint]);

    usePendingTransactionEffects({
        pendingTransactions: filteredPending,
        txsQuery,
        removePending,
    });
    
    const { unifiedTransactions, pendingCount } = useMemo(() => {
        
        const blockchainTxs: UnifiedSolanaTransaction[] = (txsQuery.data ?? []).map(createUnifiedSolanaTransaction);
        const pendingTxs: UnifiedSolanaTransaction[] = filteredPending.map(createUnifiedPendingSolanaTransaction);
        
        // Filter blockchain transactions for Solana (includes signature matching)
        const filteredBlockchainTxs = filteredPending.length > 0
            ? blockchainTxs.filter(blockchainTx => {
                // Hide blockchain transactions that match pending transaction IDs (signatures)
                const matchesPendingSignature = filteredPending.some((pendingTx: PendingSolanaTransaction) => 
                    pendingTx.id === blockchainTx.id
                );
                
                if (matchesPendingSignature) {
                    return false; // Hide blockchain transaction if it matches a pending one
                }
                
                // Show only blockchain transactions that were BEFORE the earliest pending
                const earliestPendingTime = Math.min(...filteredPending.map(tx => tx.time));
                return blockchainTx.time < earliestPendingTime;
            })
            : blockchainTxs;
        
        const allTxs = [...pendingTxs, ...filteredBlockchainTxs];
        
        return {
            unifiedTransactions: allTxs,
            pendingCount: pendingTxs.length
        };
    }, [txsQuery.data?.length, txsQuery.data?.[0]?.signature, filteredPending]);
    
    return {
        transactions: unifiedTransactions,
        pendingCount,
        hasNext: txsQuery.hasNext,
        loading: txsQuery.loading,
        refreshing: txsQuery.refreshing,
        next: txsQuery.next,
        refresh: txsQuery.refresh
    };
}
