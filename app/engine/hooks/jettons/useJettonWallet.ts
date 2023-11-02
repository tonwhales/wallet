import { useQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';
import { useClient4 } from '../network/useClient4';

export function useJettonWallet(wallet: string | null | undefined, suspense: boolean = false) {
    const { isTestnet } = useNetwork();
    const client4 = useClient4(isTestnet);
    
    let query = useQuery({
        queryKey: Queries.Account(wallet!).JettonWallet(),
        queryFn: jettonWalletQueryFn(client4, wallet!, isTestnet),
        enabled: !!wallet,
        suspense,
    });

    return query.data;
}