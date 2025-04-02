import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonWalletQueryFn } from './jettonsBatcher';
import { useNetwork } from '../network/useNetwork';
import { StoredJettonWallet } from '../../metadata/StoredMetadata';

type JettonWalletQueryParams = {
    suspense?: boolean;
    refetchInterval?: number;
};

export function useJettonWallet(wallet: string | null | undefined, params: JettonWalletQueryParams = { suspense: false }) {
    const { isTestnet } = useNetwork();

    let query = useQuery<StoredJettonWallet | null>({
        queryKey: Queries.Account(wallet!).JettonWallet(),
        queryFn: jettonWalletQueryFn(wallet!, isTestnet),
        enabled: !!wallet,
        ...params
    });

    return query.data;
}