import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { useNetwork } from '../network/useNetwork';
import { jettonWalletAddressQueryFn } from './usePrefetchHints';

export function useJettonWalletAddress(master?: string | null, account?: string | null, suspense: boolean = false) {
    let isTestnet = useNetwork().isTestnet;

    return useQuery({
        queryKey: Queries.Jettons().Address(account!).Wallet(master!),
        queryFn: jettonWalletAddressQueryFn(master!, account!, isTestnet),
        enabled: !!master && !!account,
        suspense,
        refetchOnMount: true
    });
}