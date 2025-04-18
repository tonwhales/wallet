import { useCallback, useEffect, useRef } from "react";
import { useNetwork, usePendingSolanaTransactions, useSolanaTransactions } from "..";
import { PendingTransactionStatus } from "../../state/pending";

export function usePendingSolanaActions(address: string) {
    const { isTestnet } = useNetwork();
    const [pending, setPending] = usePendingSolanaTransactions(address, isTestnet);
    const txsQuery = useSolanaTransactions(address);
    const txs = txsQuery.data;
    const latest32Txs = txs?.slice(-32) ?? [];

    useEffect(() => {
        if (!!latest32Txs) {
            remove(pending.filter((tx) => {
                // check if lastTxs already contains this tx
                if (latest32Txs.some((ltx) => ltx.signature === tx.id)) {
                    return true;
                }

                return tx.time <= (latest32Txs?.[0]?.timestamp ?? 0);
            }).map((tx) => tx.id));
        }
    }, [latest32Txs, pending]);
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

    const markAsTimedOut = useCallback((id: string) => {
        setStatus(id, PendingTransactionStatus.TimedOut);
    }, []);

    const markAsSent = useCallback((id: string) => {
        setStatus(id, PendingTransactionStatus.Sent);
    }, []);

    return { state: pending, remove, markAsTimedOut, markAsSent, txsQuery };
}