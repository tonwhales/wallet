import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useEffect } from "react";
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { useNetwork } from '../network';
import { usePendingTransactions } from ".";

export function usePendingWatcher(address?: string) {
    const { isTestnet } = useNetwork();
    const account = useSelectedAccount();
    const acc = address || account?.addressString || '';
    const [pending, setPending] = usePendingTransactions(acc, isTestnet);

    const firstTransaction = useRawAccountTransactions(acc, { refetchOnMount: true }).data?.pages[0]?.[0];
    const firstTransactionTime = firstTransaction?.time;
    const toRemove = pending.filter(a => a.time < (firstTransactionTime || 0)).map(a => a.id);

    useEffect(() => {
        if (!toRemove) {
            return;
        }

        const newPending = pending.filter(a => !toRemove.includes(a.id));
        setPending(newPending);
    }, [toRemove.join(',')]);
}