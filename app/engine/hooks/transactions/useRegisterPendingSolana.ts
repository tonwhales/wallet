import { PendingSolanaTransaction } from "../../state/pending";
import { useNetwork, usePendingSolanaTransactions, useSolanaSelectedAccount } from "..";

export function useRegisterPendingSolana(address?: string) {
    const account = useSolanaSelectedAccount();
    const network = useNetwork();
    const accountString = address || account || '';
    const [, update] = usePendingSolanaTransactions(accountString, network.isTestnet);

    return (tx: PendingSolanaTransaction) => {
        update((old) => {
            if (old.find((t) => t.id == tx.id)) {
                return old;
            }

            return [...old, tx];
        });
    }
}