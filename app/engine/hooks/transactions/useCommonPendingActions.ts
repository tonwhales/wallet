import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePendingTransactions, usePendingSolanaTransactions, useCurrentAddress, useNetwork } from "..";
import { PendingTransactionStatus, PendingSolanaTransaction, PendingTransaction } from "../../state/pending";
import { TransactionType } from "../../types";
import { useAccountTransactionsV3 } from "./useAccountTransactionsV3";
import { usePendingTransactionEffects } from "./usePendingTransactionEffects";
import { SolanaTransaction } from "../../api/solana/fetchSolanaTransactions";

type UnifiedPendingResult = {
    tonPending: PendingTransaction[];
    solanaPending: PendingSolanaTransaction[];
    removePending: (ids: string[], txType: TransactionType) => void;
    markAsTimedOut: (id: string, txType: TransactionType) => Promise<void>;
    markAsSent: (id: string, txType: TransactionType) => void;
};

export function useCommonPendingActions(
    {
        tonAddress,
        onRefreshCallback
    }: {
        tonAddress?: string,
        onRefreshCallback?: () => void
    } = {}
): UnifiedPendingResult {
    const { tonAddressString, solanaAddress } = useCurrentAddress();
    const { isTestnet } = useNetwork();
    const [tonPending, setTonPending] = usePendingTransactions(tonAddress || tonAddressString, isTestnet);
    const [solanaPending, setSolanaPending] = usePendingSolanaTransactions(solanaAddress!, isTestnet);

    const setTonPendingRef = useRef(setTonPending);
    const setSolanaPendingRef = useRef(setSolanaPending);

    const txsQuery = useAccountTransactionsV3({ refetchOnMount: false });
    const txs = txsQuery.data;
    const last32Txs = txs?.slice(0, 32);

    useEffect(() => {
        setTonPendingRef.current = setTonPending;
    }, [setTonPending]);

    useEffect(() => {
        setSolanaPendingRef.current = setSolanaPending;
    }, [setSolanaPending]);

    const onRefresh = useCallback(() => {
        txsQuery.refresh();
        onRefreshCallback?.();
    }, [onRefreshCallback]);

    const removePending = useCallback((ids: string[], txType: TransactionType) => {
        if (ids.length === 0) {
            return;
        }

        if (txType === TransactionType.TON) {
            setTonPendingRef.current((prev) => {
                return prev.filter((tx) => !ids.includes(tx.id));
            });
        } else if (txType === TransactionType.SOLANA) {
            setSolanaPendingRef.current((prev) => {
                return prev.filter((tx) => !ids.includes(tx.id));
            });
        }
    }, []);

    usePendingTransactionEffects({
        pendingTransactions: tonPending,
        txsQuery,
        removePending: (ids) => removePending(ids, TransactionType.TON),
        hideLoaderOnRefresh: true
    });

    usePendingTransactionEffects({
        pendingTransactions: solanaPending,
        txsQuery,
        removePending: (ids) => removePending(ids, TransactionType.SOLANA),
        hideLoaderOnRefresh: true
    });

    const markAsTimedOut = useCallback(async (id: string, txType: TransactionType) => {
        onRefresh();
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (txType === TransactionType.TON) {
            setTonPendingRef.current((prev) => {
                return prev.map((tx) => {
                    if (tx.id === id) {
                        return { ...tx, status: PendingTransactionStatus.TimedOut };
                    }
                    return tx;
                });
            });
        } else if (txType === TransactionType.SOLANA) {
            setSolanaPendingRef.current((prev) => {
                return prev.map((tx) => {
                    if (tx.id === id) {
                        return { ...tx, status: PendingTransactionStatus.TimedOut };
                    }
                    return tx;
                });
            });
        }
    }, [onRefresh]);

    const markAsSent = useCallback((id: string, txType: TransactionType) => {
        if (txType === TransactionType.TON) {
            setTonPendingRef.current((prev) => {
                return prev.map((tx) => {
                    if (tx.id === id) {
                        return { ...tx, status: PendingTransactionStatus.Sent };
                    }
                    return tx;
                });
            });
        } else if (txType === TransactionType.SOLANA) {
            setSolanaPendingRef.current((prev) => {
                return prev.map((tx) => {
                    if (tx.id === id) {
                        return { ...tx, status: PendingTransactionStatus.Sent };
                    }
                    return tx;
                });
            });
        }

        onRefresh();
    }, [onRefresh]);

    // Check TON pending transactions
    useEffect(() => {
        if (!last32Txs) return;

        const tonTxs = last32Txs.filter(tx => tx.type === TransactionType.TON);

        const toMarkAsSent = tonPending.filter((tx) => {
            if (tx.status !== PendingTransactionStatus.Pending) {
                return false;
            }

            return tonTxs.some((t) => {
                if (t.type !== TransactionType.TON) return false;

                const txSeqno = t.data.base?.parsed?.seqno;
                const isBlockchainTxNewerThanPending = (t.data.base.time - tx.time) >= 0;
                const seqnoDiff = tx.seqno - (txSeqno ?? 0);

                // in some cases (like gasless USDT) seqno is not present, that's why we use time comparison
                if (!txSeqno || seqnoDiff < -1000) {
                    return isBlockchainTxNewerThanPending;
                }

                return tx.seqno <= txSeqno;
            });
        });

        toMarkAsSent.forEach((tx) => {
            markAsSent(tx.id, TransactionType.TON);
        });
    }, [last32Txs, tonPending, markAsSent]);

    // Check Solana pending transactions
    useEffect(() => {
        if (!last32Txs) return;

        const solanaTxs = last32Txs.filter(tx => tx.type === TransactionType.SOLANA);

        const toMarkAsSent = solanaPending.filter((tx) => {
            if (tx.status !== PendingTransactionStatus.Pending) {
                return false;
            }

            // Check if transaction is in blockchain
            const foundInBlockchain = solanaTxs.some((t) => {
                return (t.data as SolanaTransaction).signature === tx.id;
            });

            if (foundInBlockchain) {
                return true;
            }

            // Check by time if not found by signature
            const firstSolanaTx = solanaTxs.find(t => t.type === TransactionType.SOLANA);
            if (firstSolanaTx && firstSolanaTx.type === TransactionType.SOLANA) {
                return tx.time <= (firstSolanaTx.data.timestamp ?? 0);
            }

            return false;
        });

        toMarkAsSent.forEach((tx) => {
            markAsSent(tx.id, TransactionType.SOLANA);
        });
    }, [last32Txs, solanaPending, markAsSent]);

    return {
        tonPending,
        solanaPending,
        removePending,
        markAsTimedOut,
        markAsSent
    };
}