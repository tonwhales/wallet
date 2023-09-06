import { useQuery } from '@tanstack/react-query';
import { PriceState } from '../legacy/products/PriceProduct';
import { Queries } from '../queries';
import { fetchPrice } from '../api/fetchPrice';
import { usePrimaryCurrency } from './usePrimaryCurrency';

export function usePrice(): [PriceState, string] {
    let price = useQuery({
        queryKey: Queries.TonPrice(),
        queryFn: fetchPrice,
        suspense: true,
    });

    let [currency,] = usePrimaryCurrency();

    return [
        price.data!,
        currency,
    ];
}