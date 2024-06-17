import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';

export function useJettonWallet(wallet: string | null | undefined, suspense: boolean = false) {
    const { isTestnet } = useNetwork();
    
    let query = useQuery({
        queryKey: Queries.Account(wallet!).JettonWallet(),
        queryFn: jettonWalletQueryFn(wallet!, isTestnet),
        enabled: !!wallet,
        suspense
    });

    return query.data;
}