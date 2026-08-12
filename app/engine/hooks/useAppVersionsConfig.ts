import { useQuery } from "@tanstack/react-query";
import { Queries } from "../queries";
import { useNetwork } from "./network";
import { fetchAppVersionsConfig } from "../api/fetchAppVersionsConfig";

export function useAppVersionsConfig() {
    const { isTestnet } = useNetwork();

    return useQuery({
        queryKey: Queries.AppVersionsConfig(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => fetchAppVersionsConfig(isTestnet),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        // The hard update gate reads the same query, so keep polling — a version bump
        // must reach a running app without waiting for a restart (and lift the same way)
        refetchInterval: 1000 * 60 * 5,
    })
}