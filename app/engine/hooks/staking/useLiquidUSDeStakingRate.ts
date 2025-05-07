import { useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";

const usdeRateScheme = z.object({
    usdeRate: z.string(),
}).nullish();

export type LiquidUSDeStakingRate = z.infer<typeof usdeRateScheme>;

function fetchUSDeRateQueryFn(isTestnet: boolean) {
    return async () => {
        const url = `${whalesConnectEndpoint}/usde/${isTestnet ? 'testnet' : 'mainnet'}/rate`;
        const res = await axios.get(url);

        const parsed = usdeRateScheme.safeParse(res.data);

        if (!parsed.success) {
            throw new Error('Invalid fetchLiquidUSDeStakingRateQueryFn response');
        }

        return parsed.data;
    };
}

export function useLiquidUSDeStakingRate() {
    const { isTestnet } = useNetwork();

    const query = useQuery<LiquidUSDeStakingRate>({
        queryFn: fetchUSDeRateQueryFn(isTestnet),
        refetchOnMount: true,
        queryKey: Queries.USDeRate(isTestnet),
        staleTime: 1000 * 30
    });

    return BigInt(query.data?.usdeRate || 0);
}