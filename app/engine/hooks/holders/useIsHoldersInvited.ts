import { useQuery } from "@tanstack/react-query";
import { Address } from "@ton/core";
import { Queries } from "../../queries";
import { useMemo } from "react";
import { fetchAddressInviteCheck } from "../../api/holders/fetchAddressInviteCheck";
import { Image } from 'expo-image'

export function useIsHoldersInvited(address: string | Address | undefined, isTestnet: boolean) {
    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    const query = useQuery({
        queryKey: Queries.Holders(addressString!).Invite(),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30,
        queryFn: async (key) => {
            const check = await fetchAddressInviteCheck(addressString!, isTestnet);

            if (!!check.banner?.imageUrl) {
                Image.prefetch(check.banner.imageUrl);
            }

            return check;
        },
        enabled: !!addressString,
    });

    return query.data;
}