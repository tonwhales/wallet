import { Address } from "@ton/core";
import { useNetwork } from "../network/useNetwork";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchCardsList, fetchAccountsPublic } from "../../api/holders/fetchCards";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersAccountState } from "../../api/holders/fetchAccountState";

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
            let type = 'public';
            if (token) {
                accounts = await fetchCardsList(token);
                type = 'private';
            } else {
                accounts = await fetchAccountsPublic(addressString, isTestnet);
                type = 'public';
            }

            const filtered = accounts?.filter((a) => a.cryptoCurrency.ticker === 'TON');

            return { accounts: filtered, type };
        },

    });

    return query;
}