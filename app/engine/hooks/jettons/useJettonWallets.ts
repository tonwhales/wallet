import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './jettonsBatcher';
import { useNetwork } from '../network/useNetwork';

export function useJettonWallets(wallets: string[]) {
    const { isTestnet } = useNetwork();
    
    return useQueries({
        queries: wallets.map(m => ({
            queryKey: Queries.Account(m).JettonWallet(),
            queryFn: jettonWalletQueryFn(m, isTestnet),
        })),
    })
}