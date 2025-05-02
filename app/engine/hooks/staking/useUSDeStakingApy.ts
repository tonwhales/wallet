import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network/useNetwork";
import { fetchUSDeApy } from "../../api/fetchUSDeApy";

export function useUSDeStakingApy() {
    const { isTestnet } = useNetwork();

    return useQuery({
        queryKey: Queries.USDeApy(isTestnet),
        queryFn: () => {
            return fetchUSDeApy(isTestnet);
        },
        staleTime: 1000 * 60 * 30,
        refetchInterval: 1000 * 60 * 30,
        refetchOnMount: true
    }).data;
}