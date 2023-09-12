
import { useHints } from './useHints';
import { StoredContractMetadata } from '../../metadata/StoredMetadata';
import { useContractMetadatas } from './useContractMetadatas';

export function useFilteredHints(owner: string, filter: (metadata: StoredContractMetadata) => boolean) {
    let hints = useHints(owner);
    const metadatas = useContractMetadatas(hints);

    return metadatas.filter(a => a.data && filter(a.data)).map(a => a.data!);
}