import { useQuery } from '@tanstack/react-query';
import { useNetwork, usePrimaryCurrency } from "..";
import { Queries } from "../../queries";
import { Address } from '@ton/core';
import { z } from 'zod';
import { whalesConnectEndpoint } from '../../clients';
import axios from 'axios';

const ratesResScheme = z.record(z.number()).nullish();
export type JettonRates = z.infer<typeof ratesResScheme>;

function jettonRatesQueryFn(master: string, isTestnet: boolean): () => Promise<JettonRates> {
    return async () => {
        const key = Address.parse(master).toRawString();
        const url = `${whalesConnectEndpoint}/jettons/rates/${encodeURIComponent(key)}?isTestnet=${isTestnet}`;
        const res = await axios.get(url);
        return ratesResScheme.parse(res.data);
    }
}

export function useJettonRate(master?: string): [number | null, string] {
    const { isTestnet } = useNetwork();
    const [currency] = usePrimaryCurrency();

    const rates = useQuery({
        queryKey: Queries.Jettons().Rates(master ?? ''),
        queryFn: jettonRatesQueryFn(master!, isTestnet),
        refetchOnMount: true,
        staleTime: 1000 * 60,
        enabled: !!master
    }).data;

    const currencyRate = rates?.[currency] ?? null;

    if (!currencyRate) {
        return [null, currency];
    }

    return [currencyRate, currency];
}
