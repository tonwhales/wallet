import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { SolanaAddress } from "../../../utils/solana/core";
import { useNetwork, useSolanaClient } from "..";


export function useSolanaTransactions(address: SolanaAddress | string) {
    const client = useSolanaClient();

    const addressStr = typeof address === 'string' ? address : address;

    const query = useQuery({
        queryKey: Queries.SolanaTransactions(addressStr),
        queryFn: async () => {
            return [];
        }
    });
}