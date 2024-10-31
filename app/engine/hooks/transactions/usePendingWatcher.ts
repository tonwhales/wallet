import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useEffect } from "react";
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { useNetwork } from '../network';
import { usePendingTransactions } from ".";
import { PendingTransaction, PendingTransactionStatus } from "../../state/pending";
import { useAppConfig } from "../useAppConfig";
import { useLastWatchedBlock } from "../useLastWatchedBlock";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";

function checkIfTxTimedout(tx: PendingTransaction, txTimeout: number = 60, lastWatchedBlock: { seqno: number, lastUtime: number } | null) {
    const currentBlock = lastWatchedBlock?.seqno ?? 0;
    const blockToCheck = tx.blockSeqno + 20;

    if (tx.blockSeqno === currentBlock || blockToCheck >= currentBlock) {
        return false;
    }

    let blockCreatedAt = lastWatchedBlock?.lastUtime ?? 0;

    // check if block was created after transaction expiration date
    return blockCreatedAt > (tx.time + txTimeout);
}

export function usePendingWatcher(address?: string) {
    const { isTestnet } = useNetwork();
    const account = useSelectedAccount();
    const appConfig = useAppConfig();
    const lastBlock = useLastWatchedBlock();
    const acc = address || account?.addressString || '';
    const [pending, setPending] = usePendingTransactions(acc, isTestnet);
    const firstTransaction = useRawAccountTransactions(acc).data?.pages[0]?.[0];

    const firstTransactionTime = firstTransaction?.time;
    const toRemove = pending.filter(a => a.time < (firstTransactionTime || 0)).map(a => a.id);
    const toTimeout = pending.filter(a => checkIfTxTimedout(a, appConfig.txTimeout, lastBlock)).map(a => a.id);

    useEffect(() => {
        const oldesPending = pending.filter(t => t.status === PendingTransactionStatus.Pending).sort((a, b) => a.time - b.time)[0];

        if (!oldesPending || !lastBlock) {
            return;
        }

        const blockDiff = lastBlock.seqno - oldesPending.blockSeqno;

        if (blockDiff < 10) {
            return;
        }

        // refetch transactions
        if (!queryClient.isFetching(Queries.Transactions(acc))) {
            queryClient.invalidateQueries({
                queryKey: Queries.Transactions(acc),
                refetchPage: (last, index, allPages) => index == 0,
            });
        }

    }, [acc, lastBlock, pending]);

    useEffect(() => {
        if (!toRemove) {
            return;
        }

        const newPending = pending.map(t => {
            if (toRemove.includes(t.id)) {
                return { ...t, status: PendingTransactionStatus.Sent };
            }
            if (toTimeout.includes(t.id)) {
                return { ...t, status: PendingTransactionStatus.TimedOut };
            }
            return t;
        });
        setPending(newPending);
    }, [toRemove.join(','), toTimeout.join(',')]);
}