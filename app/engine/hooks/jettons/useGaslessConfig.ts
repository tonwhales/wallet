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
            } catch (e) {
                console.error('Failed to fetch gasless config', e);
                return null;
            }
        },
        staleTime: 1000 * 60, // 1 minute
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });
}