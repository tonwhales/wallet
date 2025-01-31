import { AccountStoredTransaction, HoldersStoredTransaction, HoldersTransaction, TonStoredTransaction, TonTransaction, TransactionType } from "../../types";
import { useAccountTransactionsV2 } from "./useAccountTransactionsV2";

export function useLastTwoTxs(account: string, type: TransactionType = TransactionType.TON) {
    const { data } = useAccountTransactionsV2(account);

    let res: AccountStoredTransaction[] = [];

    if (!!data) {
        res = data.filter((t) => t.type === type).slice(0, 2);
    }


    switch (type) {
        case TransactionType.TON:
            return res as TonStoredTransaction[];
        case TransactionType.HOLDERS:
            return res as HoldersStoredTransaction[];
        default:
            return res as AccountStoredTransaction[];
    }
}