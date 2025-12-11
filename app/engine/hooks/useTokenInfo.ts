import { useQuery } from "@tanstack/react-query";
import { Queries } from "../queries";
import { TokenInfo, fetchTokenInfo } from "../api/fetchTokenInfo";

export function useTokenInfo(id?: string) {
    return useQuery<TokenInfo | null>({
        queryKey: Queries.TokenInfo(id ?? ''),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        // staleTime: 1000 * 60 * 60,
        staleTime: 1000,
        enabled: !!id,
        queryFn: async () => {
            if (!id) {
                return null;
            }
            return await fetchTokenInfo(id);
        },
    });
}