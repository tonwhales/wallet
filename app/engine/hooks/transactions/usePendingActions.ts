import { useCallback, useEffect, useRef } from "react";
import { usePendingTransactions } from "..";
import { PendingTransactionStatus } from "../../state/pending";
import { TonTransaction, TransactionType } from "../../types";
import { useAccountTransactionsV2 } from "./useAccountTransactionsV2";
import { usePendingTransactionEffects } from "./usePendingTransactionEffects";

export function usePendingActions(address: string, isTestnet: boolean, onRefreshCallback?: () => void) {
    const [pending, setPending] = usePendingTransactions(address, isTestnet);
    const setPendingRef = useRef(setPending);
    const txsQuery = useAccountTransactionsV2(address, undefined, { type: TransactionType.TON });
    const txs = txsQuery.data;
    const last32Txs = (txs as TonTransaction[])?.slice(0, 32);

    useEffect(() => {
        setPendingRef.current = setPending;
    }, [setPending]);

    const onRefresh = useCallback(() => {
        txsQuery.refresh();
        onRefreshCallback?.();
    }, []);

    const removePending = useCallback((ids: string[]) => {
        if (ids.length === 0) {
            return;
        }
        setPendingRef.current((prev) => {
            return prev.filter((tx) => !ids.includes(tx.id));
        });
    }, []);

    usePendingTransactionEffects({
        pendingTransactions: pending,
        txsQuery,
        removePending,
        hideLoaderOnRefresh: true
    });

    const markAsTimedOut = useCallback(async (id: string) => {
        onRefresh();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setPendingRef.current((prev) => {
            return prev.map((tx) => {
                if (tx.id === id) {
                    return { ...tx, status: PendingTransactionStatus.TimedOut };
                }
                return tx;
            });
        });
    }, []);

    const markAsSent = useCallback((id: string) => {
        setPendingRef.current((prev) => {
            return prev.map((tx) => {
                if (tx.id === id) {
                    return { ...tx, status: PendingTransactionStatus.Sent };
                }
                return tx;
            });
        });

        onRefresh();
    }, []);

    useEffect(() => {
        const toMarkAsSent = pending.filter((tx) => {
            const isToBeMarkedAsSent = last32Txs.some((t) => {
                const txSeqno = t.base?.parsed?.seqno;
                const isBlockchainTxNewerThanPending = (t.base.time - tx.time) > 0;
                const seqnoDiff = tx.seqno - (txSeqno ?? 0);

                // in some cases (like gasless USDT) seqno is not present, that's why we use time comparison
                if (!txSeqno || seqnoDiff < -1000) {
                    return isBlockchainTxNewerThanPending
                }

                return tx.seqno <= txSeqno;
            });

            return isToBeMarkedAsSent && tx.status === PendingTransactionStatus.Pending;
        });

        toMarkAsSent.forEach((tx) => {
            markAsSent(tx.id);
        });

    }, [last32Txs, pending, markAsSent]);

    return { state: pending, removePending, markAsTimedOut, markAsSent };
}