import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { useNetwork } from '../network/useNetwork';
import { jettonWalletAddressQueryFn } from './usePrefetchHints';

export function useJettonWalletAddress(master?: string | null, wallet?: string | null, suspense: boolean = false) {
    let isTestnet = useNetwork().isTestnet;

    return useQuery({
        queryKey: Queries.Jettons().Address(wallet!).Wallet(master!),
        queryFn: jettonWalletAddressQueryFn(master!, wallet!, isTestnet),
        enabled: !!master && !!wallet,
        suspense,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });
}