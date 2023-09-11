import { useEffect } from 'react';
import { useHints } from './basic/useHints';
import { useNetwork } from './useNetwork';
import { Queries } from '../queries';
import { fetchMetadata } from '../metadata/fetchMetadata';
import { getLastBlock } from '../accountWatcher';
import { useClient4 } from './useClient4';
import { fetchJettonMasterContent } from '../metadata/fetchJettonMasterContent';
import { Address, TonClient4 } from 'ton';
import { queryClient } from '../clients';
import { StoredContractMetadata } from '../metadata/StoredMetadata';

export function hintsMetadataQueryFn(client: TonClient4, isTestnet: boolean, address: Address) {
    return async (): Promise<StoredContractMetadata> => {
        let metadata = await fetchMetadata(client, await getLastBlock(), address);
        return {
            jettonMaster: metadata.jettonMaster ? {
                content: metadata.jettonMaster.content,
                mintable: metadata.jettonMaster.mintalbe,
                owner: metadata.jettonMaster.owner?.toFriendly({ testOnly: isTestnet }) ?? null,
                totalSupply: metadata.jettonMaster.totalSupply.toString(10),
            } : null,
            jettonWallet: metadata.jettonWallet ? {
                balance: metadata.jettonWallet.balance.toString(10),
                master: metadata.jettonWallet.master.toFriendly({ testOnly: isTestnet }),
                owner: metadata.jettonWallet.owner.toFriendly({ testOnly: isTestnet }),
            } : null,
            seqno: metadata.seqno,
            address: address.toFriendly({ testOnly: isTestnet }),
        }
    }
}

export function jettonMasterContentQueryFn(master: string, isTestnet: boolean) {
    return async () => {
        let address = Address.parse(master);
        return {
            ...await fetchJettonMasterContent(address, isTestnet),
            address: address.toFriendly({ testOnly: isTestnet }),
        };
    }
}

export function usePrefetchHints(address: string) {
    const hints = useHints(address);
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    useEffect(() => {
        (async () => {
            await Promise.all(hints.map(async hint => {
                let hintAddress = Address.parse(hint);

                let result = queryClient.getQueryData<StoredContractMetadata>(Queries.Account(hint).Metadata());
                if (!result) {
                    result = await queryClient.fetchQuery({
                        queryKey: Queries.Account(hint).Metadata(),
                        queryFn: hintsMetadataQueryFn(client, isTestnet, hintAddress),
                    });
                }

                if (result?.jettonWallet?.master) {
                    let masterAddress = result!.jettonWallet!.master;
                    try {

                        await queryClient.prefetchQuery({
                            queryKey: Queries.Jettons().MasterContent(masterAddress),
                            queryFn: jettonMasterContentQueryFn(masterAddress, isTestnet),
                        });
                    } catch (e) {
                        console.log('Failed to prefetch jetton master content', e, masterAddress)
                    }
                }
                if (result?.jettonMaster) {
                    await queryClient.prefetchQuery({
                        queryKey: Queries.Jettons().MasterContent(hint),
                        queryFn: jettonMasterContentQueryFn(hint, isTestnet), 
                    });
                }
            }));
        })().catch((e) => {
            console.error(e);
        });
    }, [hints]);
}