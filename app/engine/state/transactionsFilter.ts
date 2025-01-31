import { atomFamily } from "recoil";
import { AccountTransactionsParams } from "../api/fetchAccountTransactionsV2";

export const transactionsFilterState = atomFamily<AccountTransactionsParams | undefined, string>({
    key: "transactionsFilterState",
    default: () => undefined
});