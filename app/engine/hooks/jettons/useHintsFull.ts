import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHintsFull, JettonFull } from '../../api/fetchHintsFull';
import { useNetwork } from '../network';
import { warn } from '../../../utils/log';

export function useHintsFull(addressString?: string) {
    const { isTestnet } = useNetwork();

    return useQuery<JettonFull[]>({
        queryKey: Queries.HintsFull(addressString || ''),
        queryFn: async () => {
            try {
                const fetched = await fetchHintsFull(addressString!, isTestnet);
                return fetched;
            } catch (error) {
                warn('Failed to fetch hints');
                throw error;
            }
        },
        enabled: !!addressString,
        refetchOnMount: true,
        staleTime: 1000 * 30
    });;
}