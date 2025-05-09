import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchExtraCurrencyHints, ExtraCurrencyHint } from '../../api/fetchExtraCurrencyHints';
import { useNetwork } from '../network';
import { warn } from '../../../utils/log';

export function useExtraCurrencyHints(addressString?: string) {
    const { isTestnet } = useNetwork();

    return useQuery<ExtraCurrencyHint[]>({
        queryKey: Queries.HintsExtra(addressString || ''),
        queryFn: async () => {
            try {
                const fetched = await fetchExtraCurrencyHints(addressString!, isTestnet);
                return fetched;
            } catch (error) {
                warn('Failed to fetch hints');
                throw error;
            }
        },
        enabled: !!addressString,
        refetchOnMount: true,
        staleTime: 1000 * 30
    });
}