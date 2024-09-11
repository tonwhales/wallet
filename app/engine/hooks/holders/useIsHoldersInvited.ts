import { useQuery } from "@tanstack/react-query";
import { Address } from "@ton/core";
import { Queries } from "../../queries";
import { useMemo } from "react";
import { fetchAddressInviteCheck } from "../../api/holders/fetchAddressInviteCheck";

export function useIsHoldersInvited(address: string | Address, isTestnet: boolean) {
    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    const query = useQuery({
        queryKey: Queries.Holders(addressString).Invite(),
        refetchOnMount: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async (key) => {
            return await fetchAddressInviteCheck(addressString, isTestnet);
        }
    });

    return query.data;
}