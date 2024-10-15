import { Address } from "@ton/core";
import { useMemo } from "react";
import { useHoldersAccounts } from "./useHoldersAccounts";

export type HoldersAccountTarget = {
    address: Address,
    memo: string | undefined,
    name: string | null | undefined,
    accountIndex: number,
    jettonMaster: string | null | undefined,
    symbol: string,
}

export function useHoldersAccountTrargets(address: string | Address): HoldersAccountTarget[] {
    const data = useHoldersAccounts(address).data;

    const readyAccounts = useMemo(() => {
        const isPrivate = data?.type === 'private';
        return (data?.accounts ?? []).filter((item) => {
            if (!item.address) {
                return false;
            }

            try {
                Address.parse(item.address);
            } catch {
                return false;
            }

            return true;
        }).map((item) => {
            let memo: string | undefined = undefined;

            if (isPrivate && item.cryptoCurrency.ticker === 'TON') {
                memo = 'Top Up';
            }

            return {
                address: Address.parse(item.address!),
                memo,
                name: item.name,
                accountIndex: item.accountIndex,
                jettonMaster: item.cryptoCurrency.tokenContract,
                symbol: item.cryptoCurrency.ticker
            };
        });
    }, [data?.accounts, data?.type]);

    return readyAccounts;
}