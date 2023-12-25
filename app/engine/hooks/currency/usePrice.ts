import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { PriceState, fetchPrice } from '../../api/fetchPrice';
import { usePrimaryCurrency } from './usePrimaryCurrency';

export function usePrice(): [PriceState, string] {
    let price = useQuery({
        queryKey: Queries.TonPrice(),
        queryFn: fetchPrice,
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true,
    });

    let [currency,] = usePrimaryCurrency();

    return [
        price.data!,
        currency,
    ];
}