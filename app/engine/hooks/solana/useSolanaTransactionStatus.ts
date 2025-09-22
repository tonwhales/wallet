import { useQuery } from "@tanstack/react-query";
import { fetchSolanaTransactionStatus } from "../../api/solana/fetchSolanaTransactionStatus";
import { Queries } from "../../queries";

export function useSolanaTransactionStatus(owner: string, signature: string, network: 'mainnet' | 'devnet') {
    return useQuery({
        queryKey: Queries.SolanaAccount(owner, network).TransactionStatus(signature),
        queryFn: () => fetchSolanaTransactionStatus(signature, network),
        cacheTime: 60 * 1000,
        refetchInterval: 6000,
        staleTime: 6000
    });
}