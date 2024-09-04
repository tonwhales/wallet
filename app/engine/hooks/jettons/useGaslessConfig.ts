import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "..";
import { fetchGaslessConfig } from "../../api/gasless/fetchGaslessConfig";

export function useGaslessConfig() {
    const { isTestnet } = useNetwork();
    
    return useQuery({
        queryKey: Queries.Jettons().GaslessConfig(),
        queryFn: async () => {
            try {
                return await fetchGaslessConfig(isTestnet);
            } catch {
                return null;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });
}