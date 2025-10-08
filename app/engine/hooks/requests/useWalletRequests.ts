import { useQuery } from "@tanstack/react-query";
import { getWalletRequests } from "../../api/requests/getWalletRequests";
import { Queries } from "../../queries";

export function useWalletRequests(
    {
        address,
        isTestnet,
        type,
        refetchInterval = 1000 * 10,
        enabled
    }: {
        address: string,
        isTestnet: boolean,
        type: 'pending-outgoing' | 'pending-incoming' | 'All',
        refetchInterval: number,
        enabled?: boolean
    }
) {
    return useQuery({
        queryKey: Queries.WalletRequests(address, isTestnet, type),
        queryFn: () => getWalletRequests(address, isTestnet, type),
        refetchInterval,
        staleTime: refetchInterval,
        refetchOnMount: true,
        enabled
    });
}