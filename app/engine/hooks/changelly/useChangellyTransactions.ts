import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useCurrentAddress } from "../appstate";
import { 
    fetchChangellyUserTransactions,
    ChangellyTransactionStatus,
    ChangellyTransactionModel
} from "../../api/changelly/fetchChangellyUserTransactions";

interface UseChangellyTransactionsParams {
    limit?: number;
    offset?: number;
    status?: ChangellyTransactionStatus;
}

export function useChangellyTransactions(params?: UseChangellyTransactionsParams) {
    const { tonAddressString, solanaAddress } = useCurrentAddress();
    
    const wallet = { ton: tonAddressString!, solana: solanaAddress };

    return useQuery<ChangellyTransactionModel[]>({
        queryKey: Queries.Changelly(tonAddressString!).Transactions(),
        queryFn: async () => {            
            const result = await fetchChangellyUserTransactions({
                wallet,
                ...params
            });
            
            if (!result) {
                throw new Error('Failed to fetch transactions');
            }
            
            if (!result.ok) {
                throw new Error(result.message || result.error);
            }
            
            return result.data;
        },
        enabled: !!tonAddressString,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
        cacheTime: 0,
        refetchInterval: (data) => {
            return data && data.length > 0 ? 5000 : false;
        },
    });
}