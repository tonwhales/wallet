import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { contractMetadataQueryFn } from '../usePrefetchHints';
import { useNetwork } from '../useNetwork';
import { useClient4 } from '../useClient4';

export function useContractMetadatas(contracts: string[]) {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    
    return useQueries({
        queries: contracts.map(m => ({
            queryKey: Queries.Account(m).Metadata(),
            queryFn: contractMetadataQueryFn(client, isTestnet, m),
            staleTime: Infinity,
        })),
    })
}