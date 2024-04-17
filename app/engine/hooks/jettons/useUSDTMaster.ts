import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchUSDTMaster } from "../../api/fetchUSDTMaster";
import { Address } from "@ton/core";

export function useUSDTMaster(isTestnet: boolean) {
    return useQuery({
        queryKey: Queries.Jettons().USDTMaster(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            const { testnet, mainnet } = await fetchUSDTMaster();

            try {
                const masterStr = isTestnet ? testnet : mainnet;

                if (!masterStr) {
                    return null;
                }

                const masterAddr = Address.parse(masterStr);

                return {
                    address: masterAddr,
                    addressString: masterStr,
                };
            } catch {
                return null;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}