import { Address } from "@ton/core";
import { useMemo } from "react";
import { useHoldersAccounts } from "./useHoldersAccounts";
import { GeneralHoldersAccount } from "../../api/holders/fetchAccounts";
import { hasDirectDeposit } from "../../../utils/holders/hasDirectDeposit";

export type HoldersAccountTarget = {
    address: Address,
    memo: string | undefined,
    name: string | null | undefined,
    accountIndex: number,
    jettonMaster: string | null | undefined,
    symbol: string,
}

export function mapHoldersAccountTarget(account: GeneralHoldersAccount): HoldersAccountTarget {
    let memo: string | undefined = undefined;

    if (account.cryptoCurrency.ticker === 'TON') {
        memo = 'Top Up';
    }

    return {
        address: Address.parse(account.address!),
        memo,
        name: account.name,
        accountIndex: account.accountIndex,
        jettonMaster: account.cryptoCurrency.tokenContract,
        symbol: account.cryptoCurrency.ticker
    };
}

export function useHoldersAccountTrargets(address: string | Address): HoldersAccountTarget[] {
    const data = useHoldersAccounts(address).data;

    const readyAccounts = useMemo(() => {
        const isPrivate = data?.type === 'private';
        const accountsWithDeposit = data?.accounts?.filter(acc => hasDirectDeposit(acc)) ?? [];

        return accountsWithDeposit
            .filter((item) => {
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

                if (isPrivate && item.cryptoCurrency.ticker === 'TON' && item.contract !== 'ton.card.v7') {
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