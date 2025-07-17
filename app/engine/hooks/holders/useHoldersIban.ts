import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchIbanPromo } from "../../api/holders/fetchIbanPromo";
import { getHoldersToken } from "../../../storage/holders";

export function useHoldersIban(address: string | Address | undefined) {
    const { isTestnet } = useNetwork();

    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    return useQuery({
        queryKey: Queries.Holders(addressString!).Iban(),
        queryFn: async (key) => {
            let addr = key.queryKey[1];
            const token = getHoldersToken(addr);

            if (!token) {
                return { enabled: false }
            }
            
            const fetched = await fetchIbanPromo(token, isTestnet);
            
            if (!fetched.ok) {
                return { enabled: false }
            }

            return fetched
        },
        enabled: !!addressString,
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 60
    });
}