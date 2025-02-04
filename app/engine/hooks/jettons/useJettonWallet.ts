import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './jettonsBatcher';
import { useNetwork } from '../network/useNetwork';

type JettonWalletQueryParams = {
    suspense?: boolean;
    refetchInterval?: number;
};

export function useJettonWallet(wallet: string | null | undefined, params: JettonWalletQueryParams = { suspense: false }) {
    const { isTestnet } = useNetwork();

    let query = useQuery({
        queryKey: Queries.Account(wallet!).JettonWallet(),
        queryFn: jettonWalletQueryFn(wallet!, isTestnet),
        enabled: !!wallet,
        ...params
    });

    return query.data;
}