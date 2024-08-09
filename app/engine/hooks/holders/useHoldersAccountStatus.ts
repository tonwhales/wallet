import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { Address } from "@ton/core";
import { useMemo } from "react";
import { useNetwork } from "../network/useNetwork";
import { storage } from "../../../storage/storage";
import { HoldersAccountState, accountStateCodec, fetchAccountState } from "../../api/holders/fetchAccountState";
import { z } from 'zod';
import { removeProvisioningCredentials } from "../../holders/updateProvisioningCredentials";

const holdersAccountStatus = z.union([
    z.object({ state: z.literal(HoldersAccountState.NeedEnrollment) }),
    z.intersection(z.object({ token: z.string() }), accountStateCodec),
]);

export type HoldersAccountStatus = z.infer<typeof holdersAccountStatus>;

// Migrate holders token from ton-x to ton-connect
// user will be prompted to re-enroll
const migrationKey = 'holders-token-ton-connect';
function migrateHoldersToken(addressString: string) {
    const key = `${migrationKey}-${addressString}`;
    if (storage.getBoolean(key)) {
        return false;
    }
    deleteHoldersToken(addressString);
    storage.set(key, true);
    return true;
}

export function deleteHoldersToken(address: string) {
    // clean up provisioning credentials cache for this address
    removeProvisioningCredentials(address);    
    storage.delete(`holders-jwt-${address}`);
}

export function setHoldersToken(address: string, token: string) {
    storage.set(`holders-jwt-${address}`, token);
}

export function getHoldersToken(address: string) {
    // Migate to ton-connect
    if (migrateHoldersToken(address)) {
        return null;
    }
    return storage.getString(`holders-jwt-${address}`);
}

export function useHoldersAccountStatus(address: string | Address) {
    const { isTestnet } = useNetwork();

    const addressString = useMemo(() => {
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
                return { state: HoldersAccountState.NeedEnrollment } as HoldersAccountStatus; // This looks amazingly stupid
            }

            const fetched = await fetchAccountState(token, isTestnet);

            if (!fetched) {
                return { state: HoldersAccountState.NeedEnrollment } as HoldersAccountStatus;
            }

            return { ...fetched, token } as HoldersAccountStatus;
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: 1000 * 60 * 5,
        staleTime: 1000 * 60 * 60 * 24,
    });
}