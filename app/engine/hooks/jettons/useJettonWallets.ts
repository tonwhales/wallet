import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';
import { useClient4 } from '../network/useClient4';

export function useJettonWallets(wallets: string[]) {
    const { isTestnet } = useNetwork();
    const client4 = useClient4(isTestnet);
    
    return useQueries({
        queries: wallets.map(m => ({
            queryKey: Queries.Account(m).JettonWallet(),
            queryFn: jettonWalletQueryFn(client4, m, isTestnet),
        })),
    })
}