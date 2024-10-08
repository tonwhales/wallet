import { useAccountLite } from "../accounts/useAccountLite";
import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useEffect } from "react";
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { useClient4, useNetwork } from '../network';
import { useWalletV4 } from '../accounts/useWalletV4';
import { useSetRecoilState } from "recoil";
import { pendingTransactionsState } from "../../state/pending";
import { Address } from "@ton/core";

export function usePendingWatcher(address?: string) {
    const account = useSelectedAccount();
    const acc = address || account?.addressString || '';
    const client = useClient4(useNetwork().isTestnet);
    const setPending = useSetRecoilState(pendingTransactionsState(acc));

    const v4 = useWalletV4(client, acc);
    const lite = useAccountLite(acc ? Address.parse(acc) : null);
    const firstTransaction = useRawAccountTransactions(acc, { refetchOnMount: true }).data?.pages[0]?.[0];

    const txsInSync = firstTransaction?.hash === lite?.last?.hash && (v4.data?.last || 0) >= (lite?.block || 0);

    useEffect(() => {
        // transactions are not in sync - skip
        if (!txsInSync) {
            return;
        }

        // do not clean pending while seqno is not ready
        if (!v4.data?.seqno) {
            return;
        }

        setPending((prev) => {
            if (prev.length === 0) {
                return prev;
            }
            return prev.map((a) => {
                if (a.seqno < v4.data!.seqno) {
                    return { ...a, status: 'sent' };
                }
                return a;
            });
        });
    }, [txsInSync, setPending]);
}