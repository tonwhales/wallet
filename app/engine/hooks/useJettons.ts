import { Address } from 'ton';
import { useHints } from './basic/useHints';
import { useQueries } from '@tanstack/react-query';
import { Queries } from '../queries';
import { useNetwork } from './useNetwork';
import { fetchMetadata } from '../metadata/fetchMetadata';
import { useClient4 } from './useClient4';
import { getLastBlock } from '../accountWatcher';

export function useJettons(owner: string): any {
    let hints = useHints(owner);
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);

    let metadatas = useQueries({
        queries: hints.map(a => ({
            queryKey: Queries.Account(a).Metadata(),
            queryFn: async () => fetchMetadata(client, await getLastBlock(), Address.parse(a)),
        }))
    });

    return metadatas.filter(a => !!a.data?.jettonWallet).map(a => a.data?.jettonWallet?.owner.hash);
}