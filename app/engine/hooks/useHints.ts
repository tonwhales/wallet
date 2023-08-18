import { useQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { clients } from '../clients';
import { fetchHints } from '../api/fetchHints';
import { Address } from 'ton';

export function useHints(address: string, isTestnet: boolean): Address[] {
    let hints = useQuery({
        queryKey: Queries.Account(address).Hints(),
        queryFn: async (ctx) => {
            let result = await fetchHints(Address.parse(address), isTestnet);
            return result;
        }
    });
    return hints.data || [];
}