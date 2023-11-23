import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHints } from '../../api/fetchHints';
import { Address } from '@ton/core';
import { useMemo } from 'react';

export function useHints(addressString?: string): string[] {
    let hints = useQuery({
        queryKey: Queries.Hints(addressString || ''),
        queryFn: async () => {
            return await fetchHints(addressString!);
        },
        enabled: !!addressString,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    });

    return hints.data || [];
}