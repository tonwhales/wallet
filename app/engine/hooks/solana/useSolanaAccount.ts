import { useQuery } from "@tanstack/react-query";
import { SolanaAddress } from "../../../utils/solana/core";
import { Queries } from "../../queries";
import { useSolanaClient } from "./useSolanaClient";

export function useSolanaAccount(address: SolanaAddress) {
    const client = useSolanaClient();

    const account = useQuery({
        queryKey: Queries.SolanaAccount(address),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchInterval: 35 * 1000,
        queryFn: async () => {
            try {
                console.log('querying account', address);
                const account = await client.getAccountInfo(address).send();
                console.log('account res', account);

                return account.value;
            } catch (error) {
                console.error('error querying account', error);
                return null;
            }
        }
    });

    return account;
}