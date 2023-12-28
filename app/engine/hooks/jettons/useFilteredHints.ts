
import { useHints } from './useHints';
import { StoredContractMetadata } from '../../metadata/StoredMetadata';
import { useContractMetadatas } from '../metadata/useContractMetadatas';
import { useQueryClient } from '@tanstack/react-query';
import { Queries } from '../../queries';

export function useFilteredHints(owner: string, filter: (metadata: StoredContractMetadata) => boolean) {
    let hints = useHints(owner);
    let client = useQueryClient();
    let cachedWallets = client.getQueriesData<string>({ queryKey: Queries.Jettons().Address(owner).AllWallets() });
    const metadatas = useContractMetadatas([...hints, ...cachedWallets.filter(a => !!a[1]).map(a => a[1]!)]);

    return metadatas.filter(a => a.data && filter(a.data)).map(a => a.data!);
}