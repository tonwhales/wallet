import { TonTransaction } from './transactions';
import { PendingSolanaTransaction, PendingTransaction, PendingTransactionStatus } from '../state/pending';
import { JettonTransfer } from '../hooks/transactions/useJettonTransactions';
import { SolanaTransaction } from '../api/solana/fetchSolanaTransactions';

type UnifiedTransactionBase = {
    type: 'blockchain' | 'pending';
    id: string;
    time: number;
    status: 'success' | 'failed' | 'pending' | 'sent' | 'timed-out';
};

export type UnifiedTonTransaction = UnifiedTransactionBase & {
    data: TonTransaction | PendingTransaction;
};

export type UnifiedJettonTransaction = UnifiedTransactionBase & {
    data: JettonTransfer | PendingTransaction;
};

export type UnifiedSolanaTransaction = UnifiedTransactionBase & {
    data: SolanaTransaction | PendingSolanaTransaction;
};

export function createUnifiedTonTransaction(tx: TonTransaction): UnifiedTonTransaction {
    return {
        type: 'blockchain',
        id: tx.id + tx.message?.index,
        time: tx.base.time,
        status: tx.base.parsed.status,
        data: tx
    };
}

export function createUnifiedJettonTransaction(tx: JettonTransfer): UnifiedJettonTransaction {
    return {
        type: 'blockchain',
        id: tx.trace_id + tx.transaction_lt,
        time: tx.transaction_now,
        status: tx.transaction_aborted ? 'failed' : 'success',
        data: tx
    };
}

export function createUnifiedSolanaTransaction(tx: SolanaTransaction): UnifiedSolanaTransaction {
    return {
        type: 'blockchain',
        id: tx.signature,
        time: tx.timestamp,
        status: tx.transactionError ? 'failed' : 'success',
        data: tx
    };
}

function createUnifiedPendingTransaction<T extends PendingTransaction | PendingSolanaTransaction, U>(
    tx: T
): U {
    return {
        type: 'pending',
        id: tx.id,
        time: tx.time,
        status: tx.status,
        data: tx
    } as U;
}

export const createUnifiedPendingTonTransaction = createUnifiedPendingTransaction as (
    tx: PendingTransaction
) => UnifiedTonTransaction;

export const createUnifiedPendingJettonTransaction = createUnifiedPendingTransaction as (
    tx: PendingTransaction
) => UnifiedJettonTransaction;

export const createUnifiedPendingSolanaTransaction = createUnifiedPendingTransaction as (
    tx: PendingSolanaTransaction
) => UnifiedSolanaTransaction;

export function isPendingTonTransaction(unifiedTx: UnifiedTonTransaction): unifiedTx is UnifiedTonTransaction & { data: PendingTransaction } {
    return unifiedTx.type === 'pending';
}

export function isBlockchainTonTransaction(unifiedTx: UnifiedTonTransaction): unifiedTx is UnifiedTonTransaction & { data: TonTransaction } {
    return unifiedTx.type === 'blockchain';
}

export function isPendingJettonTransaction(tx: UnifiedJettonTransaction): tx is UnifiedJettonTransaction & { type: 'pending', data: PendingTransaction } {
    return tx.type === 'pending';
}

export function isBlockchainJettonTransaction(tx: UnifiedJettonTransaction): tx is UnifiedJettonTransaction & { type: 'blockchain', data: JettonTransfer } {
    return tx.type === 'blockchain';
}

export function isPendingSolanaTransaction(tx: UnifiedSolanaTransaction): tx is UnifiedSolanaTransaction & { type: 'pending', data: PendingSolanaTransaction } {
    return tx.type === 'pending';
}

export function isBlockchainSolanaTransaction(tx: UnifiedSolanaTransaction): tx is UnifiedSolanaTransaction & { type: 'blockchain', data: SolanaTransaction } {
    return tx.type === 'blockchain';
}
