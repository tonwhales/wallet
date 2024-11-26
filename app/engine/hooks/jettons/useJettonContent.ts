import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { jettonMasterContentQueryFn } from './usePrefetchHints';
import { useNetwork } from '../network/useNetwork';
import { JettonMasterState } from '../../metadata/fetchJettonMasterContent';

export function useJettonContent(master: string | null | undefined, suspense: boolean = false): (JettonMasterState & { address: string }) | null {
    const { isTestnet } = useNetwork();

    const data = useQuery({
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

    if (!data) {
        return null;
    }

    if (data?.symbol === 'USD₮') {
        data.symbol = 'USDT';
    }

    if (data?.name === 'USD₮' || data?.name === 'TetherUSD₮') {
        data.name = 'USDT';
    }

    return data;
}