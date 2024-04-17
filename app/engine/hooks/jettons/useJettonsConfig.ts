import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { KnownJettons, fetchKnownJettons } from "../../api/fetchKnownJettons";

export function useKnownJettons(isTestnet: boolean): KnownJettons | null {
    return useQuery({
        queryKey: Queries.Jettons().Known(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            const res = await fetchKnownJettons();

            if (!res) {
                return null;
            }

            return isTestnet ? res.testnet : res.mainnet;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    }).data ?? null;
}