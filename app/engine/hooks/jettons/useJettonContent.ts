import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonMasterContentQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';

export function useJettonContent(master: string | null) {
    const { isTestnet } = useNetwork();
    
    return useQuery({
        queryKey: Queries.Jettons().MasterContent(master ?? ''),
        queryFn: async () => {
            if (!master) {
                return null;
            }
            return await jettonMasterContentQueryFn(master, isTestnet)();
        },
        enabled: !!master,
    }).data ?? null;
}