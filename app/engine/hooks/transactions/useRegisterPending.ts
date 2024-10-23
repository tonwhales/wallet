import { PendingTransaction } from "../../state/pending";
import { useNetwork, usePendingTransactions, useSelectedAccount } from "..";

export function useRegisterPending(address?: string) {
    const account = useSelectedAccount();
    const network = useNetwork();
    const accountString = address || account?.addressString || '';
    const [, update] = usePendingTransactions(accountString, network.isTestnet);

    return (tx: PendingTransaction) => {
        update((old) => {
            if (old.find((t) => t.id == tx.id)) {
                return old;
            }

            return [...old, tx];
        });
    }
}