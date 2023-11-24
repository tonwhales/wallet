import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { Address } from "@ton/core";
import { useMemo } from "react";
import { useNetwork } from "../network/useNetwork";
import { storage } from "../../../storage/storage";
import { HoldersAccountState, accountStateCodec, fetchAccountState } from "../../api/holders/fetchAccountState";
import { z } from 'zod';

const holdersAccountStatus = z.union([
    z.object({ state: z.literal(HoldersAccountState.NeedEnrollment) }),
    z.intersection(z.object({ token: z.string() }), accountStateCodec),
]);

export type HoldersAccountStatus = z.infer<typeof holdersAccountStatus>;

export function deleteHoldersToken(address: string) {
    storage.delete(`holders-jwt-${address}`);
}

export function setHoldersToken(address: string, token: string) {
    storage.set(`holders-jwt-${address}`, token);
}

export function getHoldersToken(address: string) {
    return storage.getString(`holders-jwt-${address}`);
}

export function useHoldersAccountStatus(address: string | Address) {
    let { isTestnet } = useNetwork();

    let addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    return useQuery({
        queryKey: Queries.Holders(addressString).Status(),
        queryFn: async (key) => {
            let addr = key.queryKey[1];
            const token = getHoldersToken(addr);

            if (!token) {
                return { state: HoldersAccountState.NeedEnrollment } as { state: HoldersAccountState.NeedEnrollment }; // This looks amazingly stupid
            }

            const fetched = await fetchAccountState(token);

            if (!fetched) {
                return { state: HoldersAccountState.NeedEnrollment } as { state: HoldersAccountState.NeedEnrollment };
            }

            return { ...fetched, token };
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: 1000 * 60 * 5,
        staleTime: 1000 * 60 * 60 * 24,
    });
}