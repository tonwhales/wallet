import { useCallback, useEffect, useRef } from "react";
import { useNetwork, usePendingSolanaTransactions, useSolanaTokenTransactions, useSolanaTransactions } from "..";
import { PendingTransactionStatus } from "../../state/pending";

export function usePendingSolanaActions(address: string, mint?: string) {
    const { isTestnet } = useNetwork();
    const [pending, setPending] = usePendingSolanaTransactions(address, isTestnet);
    const shouldTransactionsBeFetched = pending.length > 0;
    const txsQuery = useSolanaTransactions(address, shouldTransactionsBeFetched);
    const tokenTxsQuery = useSolanaTokenTransactions(address, mint, shouldTransactionsBeFetched);
    const txs = txsQuery.data;
    const latest32Txs = txs?.slice(0, 32) ?? [];
    const tokenLatest32Txs = tokenTxsQuery.data?.slice(0, 32) ?? [];

    const setPendingRef = useRef(setPending);

    useEffect(() => {
        setPendingRef.current = setPending;
    }, [setPending]);

    const remove = useCallback((ids: string[]) => {
        if (ids.length === 0) {
            return;
        }
        setPendingRef.current((prev) => {
            return prev.filter((tx) => !ids.includes(tx.id));
        });
    }, []);

    const setStatus = (id: string, status: PendingTransactionStatus) => {
        setPendingRef.current((prev) => {
            return prev.map((tx) => {
                if (tx.id === id) {
                    return { ...tx, status };
                }
                return tx;
            });
        });
    };

    const onRefresh = useCallback(() => {
        txsQuery.refresh();
        if (mint && tokenTxsQuery) {
            tokenTxsQuery.refresh();
        }
    }, [txsQuery, tokenTxsQuery, mint]);

    const markAsTimedOut = useCallback((id: string) => {
        setStatus(id, PendingTransactionStatus.TimedOut);
        onRefresh();
    }, [onRefresh]);

    const markAsSent = useCallback((id: string) => {
        setStatus(id, PendingTransactionStatus.Sent);
        onRefresh();
    }, [onRefresh]);

    useEffect(() => {
        if (!!latest32Txs) {
            // First mark transactions as Sent instead of removing them immediately
            const toMarkAsSent = pending.filter((tx) => {
                if (tx.status !== PendingTransactionStatus.Pending) {
                    return false; // Already processed
                }

                // check if lastTxs already contains this tx
                if (latest32Txs.some((ltx) => ltx.signature === tx.id)) {
                    return true;
                }

                if (!!mint) {
                    if (tokenLatest32Txs.some((ttx) => ttx.signature === tx.id)) {
                        return true;
                    }
                }

                return tx.time <= (latest32Txs?.[0]?.timestamp ?? 0) || tx.time <= (tokenLatest32Txs?.[0]?.timestamp ?? 0);
            });

            toMarkAsSent.forEach((tx) => {
                markAsSent(tx.id);
            });
        }
    }, [latest32Txs, pending, tokenLatest32Txs, markAsSent]);

    return { state: pending, remove, markAsTimedOut, markAsSent, txsQuery };
}