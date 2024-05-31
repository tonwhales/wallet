import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { contractMetadataQueryFn } from '../jettons/usePrefetchHints';
import { useNetwork } from '../network/useNetwork';
import { useClient4 } from '../network/useClient4';

export function useContractMetadatas(contracts: string[]) {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    
    return useQueries({
        queries: contracts.map(m => ({
            queryKey: Queries.ContractMetadata(m),
            queryFn: contractMetadataQueryFn(isTestnet, m),
            staleTime: Infinity,
            cacheTime: Infinity,
        })),
    });
}