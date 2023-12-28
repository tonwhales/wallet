import { PendingTransaction } from "../../state/pending";
import { useNetwork, usePendingTransactions, useSelectedAccount } from "..";

export function useRegisterPending() {
    const account = useSelectedAccount();
    const network = useNetwork();
    const [, update] = usePendingTransactions(account?.addressString ?? '', network.isTestnet);

    return (tx: PendingTransaction) => {
        update((old) => {
            if (old.find((t) => t.id == tx.id)) {
                return old;
            }

            return [...old, tx];
        });
    }
}