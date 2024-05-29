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
import { create, keyResolver, windowedFiniteBatchScheduler } from "@yornaath/batshit";
import { clients } from '../../clients';
import { AsyncLock } from 'teslabot';


let jettonFetchersLock = new AsyncLock();
let contractMetadatasApi = create({
    fetcher: async (addressesString: string[]) => {
        return await jettonFetchersLock.inLock(async () => {
            log('[contract-metadata-query] fetching batch of ' + addressesString.length);
            let measurement = performance.now();

            let result = await Promise.all(addressesString.map(async (addressString) => {
                let client = clients.ton['mainnet'];
                let isTestnet = false;

                let address = Address.parse(addressString);
                let metadata = await fetchMetadata(client, await getLastBlock(), address, isTestnet);

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
            }));

            log('[contract-metadata-query] fetched in ' + (performance.now() - measurement));
            return result;
        })
    },
    resolver: keyResolver('address'),
    scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 40 }),
})

export function contractMetadataQueryFn(client: TonClient4, isTestnet: boolean, addressString: string) {
    return async (): Promise<StoredContractMetadata> => {
        return contractMetadatasApi.fetch(addressString);
    }
}

let jettonMastersApi = create({
    fetcher: async (masters: string[]) => {
        return await jettonFetchersLock.inLock(async () => {
            let result: (JettonMasterState & { address: string })[] = [];
            log('[jetton-master-content-query] fetching batch of ' + masters.length);
            let measurement = performance.now();

            await Promise.all(masters.map(async (master) => {
                let address = Address.parse(master);
                let masterContent = await fetchJettonMasterContent(address, false);
                if (!masterContent) {
                    return null;
                }

                result.push({
                    ...masterContent,
                    address: address.toString({ testOnly: false }),
                });
            }));

            log('[jetton-master-content-query] fetched in ' + (performance.now() - measurement));

            return result;
        });
    },
    resolver: keyResolver('address'),
    scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 10 })
})

export function jettonMasterContentQueryFn(master: string, isTestnet: boolean) {
    return async (): Promise<(JettonMasterState & { address: string }) | null> => {
        return jettonMastersApi.fetch(master);
    }
}

let jettonWalletsApi = create({
    fetcher: async (wallets: string[]) => {
        return await jettonFetchersLock.inLock(async () => {
            let result: StoredJettonWallet[] = [];
            log('[jetton-wallet-content-query] fetching batch of ' + wallets.length);
            let measurement = performance.now();
            await Promise.all(wallets.map(async (wallet) => {
                let client = clients.ton['mainnet'];
                let isTestnet = false;

                let address = Address.parse(wallet);
                let data = await tryFetchJettonWallet(client, await getLastBlock(), address);
                if (!data) {
                    return;
                }

                result.push({
                    balance: data.balance.toString(10),
                    master: data.master.toString({ testOnly: isTestnet }),
                    owner: data.owner.toString({ testOnly: isTestnet }),
                    address: wallet,
                });
            }));
            log('[jetton-wallet-content-query] fetched in ' + (performance.now() - measurement));
            return result;
        });
    },
    resolver: keyResolver('address'),
    scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 10 })
});


export function jettonWalletQueryFn(client: TonClient4, wallet: string, isTestnet: boolean) {
    return async (): Promise<StoredJettonWallet | null> => {
        return jettonWalletsApi.fetch(wallet);
    }
}

const currentJettonsVersion = 3;
const jettonsVersionKey = 'jettons-version';

function invalidateJettonsDataIfVersionChanged(queryClient: QueryClient) {
    try {
        const lastVersion = storage.getNumber(jettonsVersionKey);

        if (!lastVersion || lastVersion < currentJettonsVersion) {
            storage.set(jettonsVersionKey, currentJettonsVersion);
            queryClient.invalidateQueries(['jettons', 'master']);
            queryClient.invalidateQueries(['contractMetadata']);
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
            invalidateJettonsDataIfVersionChanged(queryClient);

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

                const masterAddress = result?.jettonWallet?.master;
                let masterContent = masterAddress
                    ? queryClient.getQueryData<JettonMasterState>(Queries.Jettons().MasterContent(masterAddress))
                    : undefined;

                if (masterAddress && !masterContent) {
                    let masterAddress = result!.jettonWallet!.master;
                    await queryClient.prefetchQuery({
                        queryKey: Queries.Jettons().MasterContent(masterAddress),
                        queryFn: jettonMasterContentQueryFn(masterAddress, isTestnet),
                    });
                }

                masterContent = queryClient.getQueryData<JettonMasterState>(Queries.Jettons().MasterContent(hint));

                if (result?.jettonMaster && !masterContent) {
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