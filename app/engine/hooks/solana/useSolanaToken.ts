import { useSolanaTokens } from "..";

export function useSolanaToken(owner: string, mint?: string | null) {
    const tokens = useSolanaTokens(owner);
    const token = tokens.data?.find((token) => token.address === mint);

    if (token) {
        return { ...token, refresh: tokens.refetch, isRefreshing: tokens.isRefetching };
    }

    return null;
}