import { TransactionType } from "../../types";
import { useAccountTransactionsV2 } from "./useAccountTransactionsV2";

export function useLastTwoTxs({ account, type = TransactionType.TON, kind }: { account: string, type?: TransactionType, kind?: string }) {
    const { data } = useAccountTransactionsV2(account, undefined, { type });

    let res = data ?? [];

    if (!!data) {
        if (!!kind) {
            res = res.filter((t) => t.base.parsed.kind === kind);
        }
        res = res.slice(0, 2)
    }

    return res;
}