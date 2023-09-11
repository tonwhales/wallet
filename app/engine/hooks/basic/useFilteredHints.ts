import { useQueries, useQuery } from '@tanstack/react-query';
import { useClient4 } from '../useClient4';
import { useNetwork } from '../useNetwork';
import { useHints } from './useHints';
import { Queries } from '../../queries';
import { contractMetadataQueryFn } from '../usePrefetchHints';
import { StoredContractMetadata } from '../../metadata/StoredMetadata';
import { useContractMetadatas } from './useContractMetadatas';

export function useFilteredHints(owner: string, filter: (metadata: StoredContractMetadata) => boolean) {
    let hints = useHints(owner);
    const metadatas = useContractMetadatas(hints);

    return metadatas.filter(a => a.data && filter(a.data)).map(a => a.data!);
}