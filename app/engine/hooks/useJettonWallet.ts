import { useQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { Queries } from '../queries';
import { jettonWalletQueryFn } from './usePrefetchHints';
import { useNetwork } from './useNetwork';
import { useClient4 } from './useClient4';

export function useJettonWallet(wallet: Address | null | undefined) {
    const { isTestnet } = useNetwork();
    const client4 = useClient4(isTestnet);

    const accountKey = wallet ? wallet.toString({ testOnly: isTestnet }) : '';
    
    let query = useQuery({
        queryKey: Queries.Account(accountKey).JettonWallet(),
        queryFn: jettonWalletQueryFn(client4, accountKey, isTestnet),
        enabled: !!wallet,
    });

    return query.data;
}