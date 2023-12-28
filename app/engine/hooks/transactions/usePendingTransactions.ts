import { useRecoilState } from "recoil";
import { PendingTransaction, pendingTransactionsState } from "../../state/pending";
import { Address } from "@ton/core";

export function usePendingTransactions(address: Address | string, isTestnet: boolean): [
    PendingTransaction[],
    (valOrUpdater: ((currVal: PendingTransaction[]) => PendingTransaction[]) | PendingTransaction[]) => void
] {
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const [state, setState] = useRecoilState(pendingTransactionsState(addressString));
    return [state, setState];
}