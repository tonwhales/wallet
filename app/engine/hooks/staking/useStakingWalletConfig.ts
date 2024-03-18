import { useQuery } from '@tanstack/react-query';
import { fetchWalletConfig } from '../../api/fetchWalletConfig';

export function useStakingWalletConfig(wallet: string) {
    return useQuery({
        queryKey: ['staking-wallet-config', wallet],
        queryFn: async () => fetchWalletConfig(wallet),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true
    }).data;
}