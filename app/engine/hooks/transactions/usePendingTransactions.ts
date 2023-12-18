import { useRecoilValue, useSetRecoilState } from "recoil";
import { PendingTransaction, pendingTransactionsState } from "../../state/pending";
import { Address } from "@ton/core";

export function usePendingTransactions(address: Address | string, isTestnet: boolean): [
    PendingTransaction[],
    (valOrUpdater: ((currVal: PendingTransaction[]) => PendingTransaction[]) | PendingTransaction[]) => void
] {
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const state = useRecoilValue(pendingTransactionsState)[addressString] || [];
    const setState = useSetRecoilState(pendingTransactionsState);

    const setPending = (updater: ((currVal: PendingTransaction[]) => PendingTransaction[]) | PendingTransaction[]) => {
        setState((currState) => {
            const newState = { ...currState };
            newState[addressString] = typeof updater === 'function' ? updater(newState[addressString] || []) : updater;
            return newState;
        });
    }

    return [state, setPending];
}