import { Address } from "@ton/core";
import { useNetwork } from "../useNetwork";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchCardsList, fetchCardsPublic } from "../../api/holders/fetchCards";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersAccountState } from "../../api/holders/fetchAccountState";

export function useHoldersCards(address: string | Address) {
    let { isTestnet } = useNetwork();
    let status = useHoldersAccountStatus(address).data;

    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    let query = useQuery({
        queryKey: Queries.Account(addressString).Holders().Cards(),
        queryFn: async (key) => {
            if (!!status && status.state !== HoldersAccountState.NoRef && status.state !== HoldersAccountState.NeedEnrollment) {
                const res = await fetchCardsList(status.token);
                if (!!res) {
                    return res;
                }
                return [];
            }

            let addr = key.queryKey[1];
            let publicRes = await fetchCardsPublic(addr, isTestnet);

            return publicRes;
        },
    });

    return query;
}