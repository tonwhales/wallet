import { useRecoilValue } from "recoil";
import { pendingTransactionsState } from "../state/pending";

export function usePendingTransactions() {

    return useRecoilValue(pendingTransactionsState);
}