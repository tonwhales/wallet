import { useCallback, useEffect, useRef } from "react";
import { usePendingSolanaTransactions } from "..";
import { PendingTransactionStatus } from "../../state/pending";

export function usePendingSolanaActions(address: string, isTestnet: boolean) {
    const [pending, setPending] = usePendingSolanaTransactions(address, isTestnet);
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

    return { state: pending, remove, markAsTimedOut, markAsSent };
}