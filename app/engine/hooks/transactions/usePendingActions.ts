import { useCallback, useEffect, useRef } from "react";
import { usePendingTransactions } from "..";

export function usePendingActions(address: string, isTestnet: boolean) {
    const [pending, setPending] = usePendingTransactions(address, isTestnet);
    const setPendingRef = useRef(setPending);

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

    const markAsTimedOut = useCallback((id: string) => {
        setPendingRef.current((prev) => {
            return prev.map((tx) => {
                if (tx.id === id) {
                    return { ...tx, status: 'timed-out' };
                }
                return tx;
            });
        });
    }, []);

    return { state: pending, removePending, markAsTimedOut };
}