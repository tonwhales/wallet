import { fetchSolanaTransactionFees } from "../../api/solana/fetchSolanaTransactionFees";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

function serializeTransaction(tx: Transaction | VersionedTransaction): string {
    if (tx instanceof VersionedTransaction) {
        return Buffer.from(tx.serialize()).toString('base64');
    }
    return tx.serialize({ requireAllSignatures: false }).toString('base64');
}

export function useSolanaTransactionFees(tx?: Transaction | VersionedTransaction) {
    const { isTestnet } = useNetwork();

    const txString = !!tx ? serializeTransaction(tx) : '';

    const query = useQuery({
        enabled: !!tx,
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