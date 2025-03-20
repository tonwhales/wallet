import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network";
import { fetchSolanaTokens } from "../../api/solana/fetchSolanaTokens";

export function useSolanaTokens(address: string) {
    const { isTestnet } = useNetwork();

    const tokens = useQuery({
        queryKey: Queries.SolanaAccount(address, isTestnet ? 'devnet' : 'mainnet').Tokens(),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        queryFn: () => fetchSolanaTokens(address, isTestnet)
    });

    return tokens;
}