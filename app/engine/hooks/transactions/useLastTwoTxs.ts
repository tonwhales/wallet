import { AccountStoredTransaction, HoldersStoredTransaction, TonStoredTransaction, TonTransaction, TransactionType } from "../../types";
import { useAccountTransactionsV2 } from "./useAccountTransactionsV2";

export function useLastTwoTxs(account: string, type: TransactionType = TransactionType.TON, kind?: string) {
    const { data } = useAccountTransactionsV2(account, undefined, { type });

    let res: AccountStoredTransaction[] = [];

    if (!!data) {
        res = data.filter((t) => t.type === type);
        if (!!kind && type === TransactionType.TON) {
            res = res.filter((t) => (t.data as TonTransaction).base.parsed.kind === kind);
        }
        res = res.slice(0, 2)
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