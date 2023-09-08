import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonMasterContentQueryFn } from '../usePrefetchHints';
import { useNetwork } from '../useNetwork';
import { Address } from 'ton';

export function useJettonContents(masters: string[]) {
    const { isTestnet } = useNetwork();
    
    return useQueries({
        queries: masters.map(m => ({
            queryKey: Queries.Jettons().MasterContent(m),
            queryFn: jettonMasterContentQueryFn(Address.parse(m), isTestnet),
        })),
    })
}