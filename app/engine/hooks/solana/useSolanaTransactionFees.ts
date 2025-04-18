import { fetchSolanaTransactionFees } from "../../api/solana/fetchSolanaTransactionFees";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network";
import { Transaction } from "@solana/web3.js";

export function useSolanaTransactionFees(tx: Transaction) {
    const { isTestnet } = useNetwork();

    const txString = tx.serialize({ requireAllSignatures: false }).toString('base64');

    const query = useQuery({
        queryKey: Queries.SolanaTransactionFees(isTestnet ? 'testnet' : 'mainnet', txString),
        queryFn: () => {
            try {
                return fetchSolanaTransactionFees(txString, isTestnet);
            } catch (error) {
                console.error(error);
                throw error;
            }
        },
        refetchOnMount: true,
        staleTime: 1000 * 5,
        cacheTime: 1000 * 60
    });

    return query.data?.value ?? 0;
}