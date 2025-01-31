import { Address } from "@ton/core";
import { useNetwork } from "..";
import { useRecoilState } from "recoil";
import { transactionsFilterState } from "../../state/transactionsFilter";
import { AccountTransactionsParams } from "../../api/fetchAccountTransactionsV2";

type Value = AccountTransactionsParams | undefined;

export function useTransactionsFilter(address: string | Address): [Value, (valOrUpdater: ((currVal: Value) => Value) | Value) => void] {
    const { isTestnet } = useNetwork();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    return useRecoilState(transactionsFilterState(addressString));
}