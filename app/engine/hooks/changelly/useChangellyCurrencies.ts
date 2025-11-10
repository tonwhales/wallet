import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchChangellyCurrencies, type ChangellyCurrenciesResponse } from "../../api/changelly/fetchChangellyCurrencies";
import { useCurrentAddress } from "../appstate";
import { Currency } from "../../types/deposit";

const CACHE_TIME = 1000 * 60 * 5;

export function useChangellyCurrencies(currencyTo: Currency) {
    const { tonAddressString } = useCurrentAddress();

    return useQuery<ChangellyCurrenciesResponse | undefined>({
        queryKey: Queries.Changelly(tonAddressString!).Currencies(currencyTo),
        queryFn: async () => {
            const result = await fetchChangellyCurrencies(currencyTo);
            return result?.filter(item => item.enabled) ?? [];
        },
        enabled: !!tonAddressString && !!currencyTo,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        staleTime: CACHE_TIME,
        cacheTime: CACHE_TIME
    });
}