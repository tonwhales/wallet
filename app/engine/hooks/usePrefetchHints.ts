import { useEffect } from 'react';
import { useHints } from './basic/useHints';
import { useNetwork } from './useNetwork';
import { Queries } from '../queries';
import { fetchMetadata } from '../metadata/fetchMetadata';
import { getLastBlock } from '../accountWatcher';
import { useClient4 } from './useClient4';
import { fetchJettonMasterContent } from '../metadata/fetchJettonMasterContent';
import { Address } from 'ton';
import { ContractMetadata } from '../metadata/Metadata';
import { queryClient } from '../clients';

export function usePrefetchHints(address: string) {
    const hints = useHints(address);
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    useEffect(() => {
        (async () => {
            await Promise.all(hints.map(async hint => {
                let hintAddress = Address.parse(hint);

                let result = queryClient.getQueryData<ContractMetadata>(Queries.Account(hint).Metadata());
                if (!result) {
                    result = await queryClient.fetchQuery({
                        queryKey: Queries.Account(hint).Metadata(),
                        queryFn: async () => {
                            return fetchMetadata(client, await getLastBlock(), hintAddress);
                        },
                    });
                }

                if (result!.jettonMaster) {
                    await queryClient.prefetchQuery({
                        queryKey: Queries.Jettons().MasterContent(hint),
                        queryFn: async () => fetchJettonMasterContent(hintAddress, false),
                    })
                }
            }));
        })();
    }, [hints]);
}