import { Address } from "@ton/core";
import { useNetwork } from "../network/useNetwork";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { GeneralHoldersAccount, PrePaidHoldersCard, fetchAccountsList, fetchAccountsPublic } from "../../api/holders/fetchAccounts";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersAccountState } from "../../api/holders/fetchAccountState";

export type HoldersAccounts = {
    accounts: GeneralHoldersAccount[], 
    type: 'public' | 'private', 
    prepaidCards?: PrePaidHoldersCard[]
}

export function useHoldersAccounts(address: string | Address) {
    let { isTestnet } = useNetwork();
    let status = useHoldersAccountStatus(address).data;

    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    const token = (
        !!status &&
        status.state !== HoldersAccountState.NoRef &&
        status.state !== HoldersAccountState.NeedEnrollment
    ) ? status.token : null;

    let query = useQuery({
        queryKey: Queries.Holders(addressString).Cards(!!token ? 'private' : 'public'),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: 35000,
        staleTime: 35000,
        queryFn: async () => {
            let accounts;
            let prepaidCards: PrePaidHoldersCard[] | undefined;
            let type = 'public';
            if (token) {
                const res = await fetchAccountsList(token, isTestnet);
                type = 'private';
                accounts = res?.accounts;
                prepaidCards = res?.prepaidCards;
            } else {
                accounts = await fetchAccountsPublic(addressString, isTestnet);
                type = 'public';
            }

            const filtered = accounts?.filter((a) => a.network === (isTestnet ? 'ton-testnet' : 'ton-mainnet'));

            const sorted = filtered?.sort((a, b) => {
                if (a.cards.length > b.cards.length) return -1;
                if (a.cards.length < b.cards.length) return 1;
                return 0;
            });

            return { accounts: sorted, type, prepaidCards } as HoldersAccounts;
        }
    });

    return query;
}