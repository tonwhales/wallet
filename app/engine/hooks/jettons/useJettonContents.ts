import { useQueries } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonMasterContentQueryFn } from './jettonsBatcher';
import { useNetwork } from '../network/useNetwork';

export function useJettonContents(masters: string[]) {
    const { isTestnet } = useNetwork();
    
    return useQueries({
        queries: masters.map(m => ({
            queryKey: Queries.Jettons().MasterContent(m),
            queryFn: jettonMasterContentQueryFn(m, isTestnet),
        })),
    })
}