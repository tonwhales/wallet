import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonMasterContentQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';
import { JettonMasterState } from '../../metadata/fetchJettonMasterContent';

export function useJettonContent(master: string | null, suspense: boolean = false): (JettonMasterState & { address: string }) | null {
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
        suspense
    }).data ?? null;
}