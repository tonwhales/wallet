import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "../network";
import { fetchSolanaAccountBalance } from "../../api/solana/fetchSolanaAccountBalance";

export function useSolanaAccount(address: string) {
    const { isTestnet } = useNetwork();

    const account = useQuery({
        queryKey: Queries.SolanaAccount(address, isTestnet ? 'devnet' : 'mainnet').Wallet(),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        queryFn: () => fetchSolanaAccountBalance(address, isTestnet)
    });

    return account;
}