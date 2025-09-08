import { useCallback, useEffect, useRef } from "react";
import { usePendingTransactions } from "..";
import { PendingTransactionStatus } from "../../state/pending";
import { TonTransaction, TransactionType } from "../../types";
import { TonStoredTransaction } from "../../types";
import { useAccountTransactionsV2 } from "./useAccountTransactionsV2";

export function usePendingActions(address: string, isTestnet: boolean) {
    const [pending, setPending] = usePendingTransactions(address, isTestnet);
    const setPendingRef = useRef(setPending);
    const txsQuery = useAccountTransactionsV2(address, undefined, { type: TransactionType.TON });
    const txs = txsQuery.data;
    const last32Txs = (txs as TonTransaction[])?.slice(-32);

    useEffect(() => {
        setPendingRef.current = setPending;
    }, [setPending]);

    const removePending = useCallback((ids: string[]) => {
        if (ids.length === 0) {
            return;
        }
        setPendingRef.current((prev) => {
            return prev.filter((tx) => !ids.includes(tx.id));
        });
    }, []);

    const markAsTimedOut = useCallback(async (id: string) => {
        await txsQuery.refresh();
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

        txsQuery.refresh();
    }, []);

    useEffect(() => {
        removePending(pending.filter((tx) => {
            const isToBeRemoved = last32Txs.some((t) => {
                const txSeqno = t.base?.parsed?.seqno;

                if (!txSeqno) {
                    return false;
                }

                const seqnoDiff = tx.seqno - txSeqno;

                // out of range
                if (seqnoDiff < -1000) {
                    const timeDiff = t.base.time - tx.time;
                    return timeDiff > 0;
                }

                return tx.seqno <= txSeqno;
            });

            return isToBeRemoved;
        }).map((tx) => tx.id));
    }, [last32Txs, pending]);

    return { state: pending, removePending, markAsTimedOut, markAsSent };
}