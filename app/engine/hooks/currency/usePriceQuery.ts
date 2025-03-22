import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchPrice } from '../../api/fetchPrice';
import { usePrimaryCurrency } from './usePrimaryCurrency';

// TODO: *solana* cleanup this type and fix usage
export type Price = { price: { usd: number, rates: { [key: string]: number } } }

export function usePriceQuery(): [Price, string, Price] {
    let price = useQuery({
        queryKey: Queries.TonPrice(),
        queryFn: fetchPrice,
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 1000 * 60
    });

    let [currency] = usePrimaryCurrency();

    const tonPrice = {
        price: {
            usd: price.data?.price.usd ?? 0,
            rates: price.data?.rates ?? {}
        }
    };

    const solanaPrice = {
        price: {
            usd: price.data?.solanaPrice?.usd ?? 0,
            rates: price.data?.rates ?? {}
        }
    };

    return [
        tonPrice,
        currency,
        solanaPrice
    ];
}