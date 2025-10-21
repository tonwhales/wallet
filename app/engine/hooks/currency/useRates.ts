import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "..";
import { fetchRates } from "../../api/fetchRates";

export function useRates(tokens: string[], currencies: string[]) {
    const { isTestnet } = useNetwork();
    return useQuery({
        queryKey: Queries.Rates(tokens.join(','), currencies.join(',')),
        queryFn: () => fetchRates({ isTestnet, tokens, currencies }),
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 1000 * 60
    }).data;
}