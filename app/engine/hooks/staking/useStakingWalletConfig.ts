import { useQuery } from '@tanstack/react-query';
import { fetchWalletConfig } from '../../api/fetchWalletConfig';

export function useStakingWalletConfig(wallet: string) {
    return useQuery({
        queryKey: ['staking-wallet-config', wallet],
        queryFn: async () => fetchWalletConfig(wallet),
    }).data;
}