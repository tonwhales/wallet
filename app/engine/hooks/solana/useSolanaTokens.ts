import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network";
import { fetchSolanaTokens, SolanaToken } from "../../api/solana/fetchSolanaTokens";

export function useSolanaTokens(address: string, isLedger?: boolean) {
    const { isTestnet } = useNetwork();

    const tokens = useQuery<SolanaToken[]>({
        queryKey: Queries.SolanaAccount(address, isTestnet ? 'devnet' : 'mainnet').Tokens(),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 6000,
        queryFn: async () => {
            if (isLedger) {
                return [];
            }
            return await fetchSolanaTokens(address, isTestnet);
        }
    });

    return tokens;
}