import { useQueries, useQuery } from '@tanstack/react-query';
import { useClient4 } from '../useClient4';
import { useNetwork } from '../useNetwork';
import { useHints } from './useHints';
import { Queries } from '../../queries';
import { hintsMetadataQueryFn } from '../usePrefetchHints';
import { Address } from 'ton';

type InferPromise<P> = P extends Promise<infer T> ? T : never;


export function useFilteredHints(owner: string, filter: (metadata: InferPromise<ReturnType<ReturnType<typeof hintsMetadataQueryFn>>>) => boolean) {
    let hints = useHints(owner);
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);


    let metadatas = useQueries({
        queries: hints.map(a => ({
            queryKey: Queries.Account(a).Metadata(),
            queryFn: hintsMetadataQueryFn(client, isTestnet, Address.parse(a)),
            staleTime: Infinity,
        }))
    });

    return metadatas.filter(a => a.data && filter(a.data)).map(a => a.data!);
}