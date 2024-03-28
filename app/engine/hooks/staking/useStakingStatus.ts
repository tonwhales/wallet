import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useClient4, useNetwork } from "..";
import { fetchStakingStatus } from "../../api/fetchStakingStatus";

export function useStakingStatus() {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    return useQuery({
        queryKey: Queries.StakingStatus(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            return await fetchStakingStatus(client, isTestnet);
        },
        refetchInterval: 1_000 * 60 * 5, // every 5 minutes
        refetchOnMount: true,
    }).data;
}