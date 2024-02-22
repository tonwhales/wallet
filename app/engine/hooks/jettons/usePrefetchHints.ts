import { useEffect } from 'react';
import { useHints } from './useHints';
import { useNetwork } from '../network/useNetwork';
import { Queries } from '../../queries';
import { fetchMetadata } from '../../metadata/fetchMetadata';
import { getLastBlock } from '../../accountWatcher';
import { useClient4 } from '../network/useClient4';
import { JettonMasterState, fetchJettonMasterContent } from '../../metadata/fetchJettonMasterContent';
import { Address } from '@ton/core';
import { StoredContractMetadata, StoredJettonWallet } from '../../metadata/StoredMetadata';
import { log } from '../../../utils/log';
import { tryFetchJettonWallet } from '../../metadata/introspections/tryFetchJettonWallet';
import { TonClient4 } from '@ton/ton';
import { QueryClient } from '@tanstack/react-query';
import { storage } from '../../../storage/storage';

export function contractMetadataQueryFn(client: TonClient4, isTestnet: boolean, addressString: string) {
    return async (): Promise<StoredContractMetadata> => {
        log('[contract-metadata] fetching ' + addressString);

        let address = Address.parse(addressString);
        let metadata = await fetchMetadata(client, await getLastBlock(), address, isTestnet);

        log('[contract-metadata] fetched ' + addressString);
        return {
            jettonMaster: metadata.jettonMaster ? {
                content: metadata.jettonMaster.content,
                mintable: metadata.jettonMaster.mintalbe,
                owner: metadata.jettonMaster.owner?.toString({ testOnly: isTestnet }) ?? null,
                totalSupply: metadata.jettonMaster.totalSupply.toString(10),
            } : null,
            jettonWallet: metadata.jettonWallet ? {
                balance: metadata.jettonWallet.balance.toString(10),
                master: metadata.jettonWallet.master.toString({ testOnly: isTestnet }),
                owner: metadata.jettonWallet.owner.toString({ testOnly: isTestnet }),
                address: addressString,
            } : null,
            seqno: metadata.seqno,
            address: address.toString({ testOnly: isTestnet }),
        }
    }
}

export function jettonMasterContentQueryFn(master: string, isTestnet: boolean) {
    return async (): Promise<(JettonMasterState & { address: string }) | null> => {
        log('[jetton-master-content-query] fetching ' + master);
        let address = Address.parse(master);
        let masterContent = await fetchJettonMasterContent(address, isTestnet);
        log('[jetton-master-content-query] fetched ' + master);
        if (!masterContent) {
            return null;
        }

        return {
            ...masterContent,
            address: address.toString({ testOnly: isTestnet }),
        };
    }
}

export function jettonWalletQueryFn(client: TonClient4, wallet: string, isTestnet: boolean) {
    return async (): Promise<StoredJettonWallet | null> => {
        log('[jetton-wallet-content-query] fetching ' + wallet);
        let address = Address.parse(wallet);
        let data = await tryFetchJettonWallet(client, await getLastBlock(), address);
        if (!data) {
            return null;
        }

        return {
            balance: data.balance.toString(10),
            master: data.master.toString({ testOnly: isTestnet }),
            owner: data.owner.toString({ testOnly: isTestnet }),
            address: wallet,
        }
    }
}

const currentJettonsVersion = 1;
const jettonsVersionKey = 'jettons-version';

async function invalidateJettonsData(queryClient: QueryClient) {
    try {
        const lastVersion = storage.getNumber(jettonsVersionKey);
    
        if (!lastVersion || lastVersion < currentJettonsVersion) {
            storage.set(jettonsVersionKey, currentJettonsVersion);
            await queryClient.invalidateQueries(['jettons', 'master']);
            await queryClient.invalidateQueries(['contractMetadata']);
        }
    } catch {
        // ignore
    }
}

export function usePrefetchHints(queryClient: QueryClient, address?: string) {
    const hints = useHints(address);
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    useEffect(() => {
        if (!address) {
            return;
        }

        (async () => {
            // Invalidate jettons data if version is changed
            await invalidateJettonsData(queryClient);

            // Prefetch contract metadata and jetton master content
            await Promise.all(hints.map(async hint => {
                let result = queryClient.getQueryData<StoredContractMetadata>(Queries.ContractMetadata(hint));
                if (!result) {
                    result = await queryClient.fetchQuery({
                        queryKey: Queries.ContractMetadata(hint),
                        queryFn: contractMetadataQueryFn(client, isTestnet, hint),
                    });

                    if (result?.jettonWallet) {
                        queryClient.setQueryData(Queries.Account(hint).JettonWallet(), () => {
                            return {
                                balance: result!.jettonWallet!.balance,
                                master: result!.jettonWallet!.master,
                                owner: result!.jettonWallet!.owner,
                            } as StoredJettonWallet
                        });
                    }
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
    }, [address, hints]);
}