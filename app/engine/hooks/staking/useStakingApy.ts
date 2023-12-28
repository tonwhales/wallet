import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network/useNetwork";
import { fetchApy } from "../../api/fetchApy";

export function useStakingApy() {
    const { isTestnet } = useNetwork();

    return useQuery({
        queryKey: Queries.APY(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: () => {
            return fetchApy(isTestnet);
        },
        refetchInterval: 1000 * 60 * 5, // sync every 5 minutes
    }).data;
}