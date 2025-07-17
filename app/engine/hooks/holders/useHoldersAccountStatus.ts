import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { Address } from "@ton/core";
import { useMemo } from "react";
import { useNetwork } from "../network/useNetwork";
import { storage } from "../../../storage/storage";
import { HoldersUserState, userStateCodec, fetchUserState } from "../../api/holders/fetchUserState";
import { z } from 'zod';
import { removeProvisioningCredentials } from "../../holders/updateProvisioningCredentials";
import axios from "axios";

const holdersAccountStatus = z.union([
    z.object({ state: z.literal(HoldersUserState.NeedEnrollment) }),
    z.intersection(z.object({ token: z.string() }), userStateCodec),
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

// Migrate holders token from ton to ton+solana
// user will be prompted to re-enroll
const solanaMigrationKey = 'holders-token-solana';
function migrateHoldersSolanaToken(address: string) {
    const key = `${solanaMigrationKey}-${address}`;
    if (storage.getBoolean(key)) {
        return false;
    }
    deleteHoldersToken(address);
    storage.set(key, true);
    return true;
}

const holdersTokenMigrationKey_0 = 'holders-token-migration-0';
function migrateHoldersToken_0(address: string) {
    const key = `${holdersTokenMigrationKey_0}-${address}`;

    if (storage.getBoolean(key)) {
        return false;
    }

    const token = getHoldersToken(address);
    if (!token) {
        storage.set(key, true);
        return true;
    }
    deleteHoldersToken(address);
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

    // Migate to solana
    if (migrateHoldersSolanaToken(address)) {
        return null;
    }

    // Migrate to new token session
    if (migrateHoldersToken_0(address)) {
        return null;
    }

    return storage.getString(`holders-jwt-${address}`);
}

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