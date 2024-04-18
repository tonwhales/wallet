import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { KnownJettons, fetchKnownJettons } from "../../api/fetchKnownJettons";

export function useKnownJettons(isTestnet: boolean): KnownJettons | null {
    const full = useQuery({
        queryKey: Queries.Jettons().Known(),
        queryFn: fetchKnownJettons,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    }).data ?? null;

    return (isTestnet ? full?.testnet : full?.mainnet) ?? null;
}