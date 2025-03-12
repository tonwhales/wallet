import { useSolanaTokens } from "..";

export function useSolanaToken(owner: string, mint?: string | null) {
    const tokens = useSolanaTokens(owner);
    return tokens.data?.find((token) => token.address === mint);
}