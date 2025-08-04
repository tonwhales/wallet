import { useQuery } from "@tanstack/react-query";
import { Queries } from "../queries";
import { useNetwork } from ".";
import { AppConfig, fetchAppConfig } from "../api/fetchAppConfig";

export function useAppConfig(): AppConfig {
    const { isTestnet } = useNetwork();
    const defaultConfig: AppConfig = {
        txTimeout: 60,
        features: { swap: true },
        changelly: {
            minAmount: 31,
            minAmountCurrency: 'usd'
        }
    };

    const remoteConfig = useQuery({
        queryKey: Queries.AppConfig(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            try {
                const res = await fetchAppConfig(isTestnet);
                return res ?? defaultConfig;
            } catch {
                return defaultConfig;
            }
        },
        staleTime: 1000 * 60,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    return {
        ...defaultConfig,
        ...remoteConfig.data,
    };
}