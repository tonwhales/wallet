import { useQuery } from "@tanstack/react-query";
import { fetchSolanaTransactionStatus } from "../../api/solana/fetchSolanaTransactionStatus";
import { Queries } from "../../queries";

// 150 blocks assiming 400ms per block
export const SOLANA_TRANSACTION_PROCESSING_TIMEOUT = 60 * 1000;

export function useSolanaTransactionStatus(signature: string, network: 'mainnet' | 'devnet') {
    return useQuery({
        queryKey: Queries.SolanaTransactionStatus(signature, network),
        queryFn: () => fetchSolanaTransactionStatus(signature, network),
        refetchInterval: 3000,
        cacheTime: 60 * 1000
    });
}