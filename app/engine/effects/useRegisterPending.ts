import { useSetRecoilState } from "recoil";
import { PendingTransaction, pendingTransactionsState } from "../state/pending";

export function useRegisterPending() {
    const update = useSetRecoilState(pendingTransactionsState);
    return (tx: PendingTransaction) => {
        update((old) => {
            if (old.find((t) => t.id == tx.id)) {
                return old;
            }

            return [...old, tx];
        });
    }
}