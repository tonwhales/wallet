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
    })
}