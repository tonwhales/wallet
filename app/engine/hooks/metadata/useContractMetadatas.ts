import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { contractMetadataQueryFn } from '../jettons/jettonsBatcher';
import { useNetwork } from '../network/useNetwork';

export function useContractMetadatas(contracts: string[]) {
    const { isTestnet } = useNetwork();
    
    return useQueries({
        queries: contracts.map(m => ({
            queryKey: Queries.ContractMetadata(m),
            queryFn: contractMetadataQueryFn(isTestnet, m),
            staleTime: Infinity,
            cacheTime: Infinity,
        })),
    });
}