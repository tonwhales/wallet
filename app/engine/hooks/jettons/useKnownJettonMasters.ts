import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchKnownJettonMasters } from "../../api/fetchKnownJettonMasters";
import { KnownJettonMasters } from "../../../secure/KnownWallets";

export function useKnownJettonMasters(isTestnet: boolean) {
    const masters = useQuery({
        queryKey: Queries.Jettons().Masters(),
        queryFn: fetchKnownJettonMasters,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    const builtInMasters = KnownJettonMasters(isTestnet);

    return {
        ...builtInMasters,
        ...(masters.data?.[isTestnet? 'testnet': 'mainnet'] ?? {})
    }
}