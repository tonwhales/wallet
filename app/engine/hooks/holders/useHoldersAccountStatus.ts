import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { Address } from "@ton/core";
import { useMemo } from "react";
import { useNetwork } from "../network/useNetwork";
import { HoldersUserState, userStateCodec, fetchUserState } from "../../api/holders/fetchUserState";
import { z } from 'zod';
import axios from "axios";
import { deleteHoldersToken, getHoldersToken } from "../../../storage/holders";

const holdersAccountStatus = z.union([
    z.object({ state: z.literal(HoldersUserState.NeedEnrollment) }),
    z.intersection(z.object({ token: z.string() }), userStateCodec),
]);

export type HoldersAccountStatus = z.infer<typeof holdersAccountStatus>;

export function useHoldersAccountStatus(address: string | Address | undefined) {
    const { isTestnet } = useNetwork();

    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    return useQuery({
        queryKey: Queries.Holders(addressString!).Status(),
        queryFn: async (key) => {
            let addr = key.queryKey[1];
            const token = getHoldersToken(addr);

            if (!token) {
                return { state: HoldersUserState.NeedEnrollment } as HoldersAccountStatus; // This looks amazingly stupid
            }

            try {
                const fetched = await fetchUserState(token, isTestnet);

                if (!fetched) { // unauthorized
                    deleteHoldersToken(addr);
                    return { state: HoldersUserState.NeedEnrollment } as HoldersAccountStatus;
                }

                return { ...fetched, token } as HoldersAccountStatus;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    deleteHoldersToken(addressString!);
                    throw new Error('Unauthorized');
                } else {
                    throw error;
                }
            }
        },
        enabled: !!addressString,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: 1000 * 15,
        staleTime: 1000 * 15
    });
}