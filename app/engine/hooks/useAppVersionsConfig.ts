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
        // Short staleTime: the hard update gate blocks the whole app based on this config,
        // so a launch must confirm it against the server instead of trusting the persisted
        // copy — a lifted `minimal` has to reach the user on the next launch. Not zero, so
        // remounting the version banner while navigating doesn't refetch on every screen
        staleTime: 1000 * 30,
        // Keep polling too, so a config change reaches a running app without a restart
        refetchInterval: 1000 * 60 * 2,
    })
}