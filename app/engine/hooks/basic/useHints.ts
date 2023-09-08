import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHints } from '../../api/fetchHints';
import { Address } from 'ton';
import { useMemo } from 'react';

export function useHints(addressString: string): string[] {
    let hints = useQuery({
        queryKey: Queries.Hints(addressString),
        queryFn: async () => {
            return await fetchHints(addressString);
        },
    });

    return hints.data || [];
}