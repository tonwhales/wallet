import { t } from './i18n/t';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useSetAppState } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { fetchAccountTransactions } from './engine/api/fetchAccountTransactions';
import { contractMetadataQueryFn, jettonMasterContentQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from './engine/hooks/transactions/useAccountTransactions';
import { getAppState } from './storage/appState';
import { useCallback } from 'react';
import { ToastDuration, useToaster } from './components/toast/ToastProvider';
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { useGlobalLoader } from './components/useGlobalLoader';
import { StoredJettonWallet } from './engine/metadata/StoredMetadata';
import { createBackoff } from './utils/time';
import { getQueryData } from './engine/utils/getQueryData';
import { StoredTransaction } from './engine/types';
import { TonConnectAuthType } from './fragments/secure/dapps/TonConnectAuthenticateFragment';
import { warn } from './utils/log';

const infoBackoff = createBackoff({ maxFailureCount: 10 });

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number },
    tonconnectType: TonConnectAuthType = TonConnectAuthType.Qr
) {
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const toaster = useToaster();
    const loader = useGlobalLoader();

    const handler = useCallback(async (resolved: ResolvedUrl) => {
        if (resolved.type === 'transaction') {
            if (resolved.payload) {
                navigation.navigateTransfer({
                    order: {
                        type: 'order',
                        messages: [{
                            target: resolved.address.toString({ testOnly: isTestnet }),
                            amount: resolved.amount || BigInt(0),
                            amountAll: false,
                            stateInit: resolved.stateInit,
                            payload: resolved.payload,
                        }]
                    },
                    text: resolved.comment,
                    job: null,
                    callback: null
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: resolved.address.toString({ testOnly: isTestnet }),
                    comment: resolved.comment,
                    amount: resolved.amount,
                    stateInit: resolved.stateInit,
                    job: null,
                    jetton: null,
                    callback: null
                });
            }
        }
        if (resolved.type === 'jetton-transaction') {
            if (!selected) {
                return;
            }

            const hideloader = loader.show();

            let jettonWalletAddress = queryClient.getQueryData<string | null>(Queries.Account(selected.addressString).JettonWallet());

            if (!jettonWalletAddress) {
                try {
                    jettonWalletAddress = await queryClient.fetchQuery({
                        queryKey: Queries.Jettons().Address(selected!.addressString).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                        queryFn: jettonWalletAddressQueryFn(resolved.jettonMaster.toString({ testOnly: isTestnet }), selected!.addressString, isTestnet)
                    });
                } catch {
                    console.warn('Failed to fetch jetton wallet address', selected!.addressString, resolved.jettonMaster.toString({ testOnly: isTestnet }));
                }
            }

            if (!jettonWalletAddress) {
                toaster.show({
                    message: t('transfer.wrongJettonTitle'),
                    ...toastProps, type: 'error'
                });
                hideloader();
                return;
            }

            let jettonWallet = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(jettonWalletAddress!).JettonWallet());

            if (!jettonWallet) {
                try {
                    jettonWallet = await queryClient.fetchQuery({
                        queryKey: Queries.Account(jettonWalletAddress!).JettonWallet(),
                        queryFn: jettonWalletQueryFn(jettonWalletAddress!, isTestnet),
                    });
                } catch {
                    console.warn('Failed to fetch jetton wallet', jettonWalletAddress);
                }
            }

            if (!jettonWallet) {
                toaster.show({
                    message: t('transfer.wrongJettonMessage'),
                    ...toastProps, type: 'error'
                });
                hideloader();
                return;
            }

            hideloader();

            navigation.navigateSimpleTransfer({
                target: resolved.address.toString({ testOnly: isTestnet }),
                comment: resolved.comment,
                amount: resolved.amount,
                stateInit: null,
                job: null,
                jetton: Address.parse(jettonWalletAddress),
                callback: null,
                payload: resolved.payload,
                feeAmount: resolved.feeAmount,
                forwardAmount: resolved.forwardAmount,
            });
        }

        if (resolved.type === 'connect') {
            navigation.navigate('Authenticate', {
                session: resolved.session,
                endpoint: resolved.endpoint
            });
        }
        if (resolved.type === 'tonconnect') {
            if (tonconnectType === TonConnectAuthType.Qr || tonconnectType === TonConnectAuthType.Link) {
                navigation.navigateConnectAuth({ query: resolved.query, type: tonconnectType });
            } else { // Callback only support in injectedBridge
                warn(`Unsupported TonConnectAuthType ${tonconnectType}`);
            }
        }
        if (resolved.type === 'install') {
            navigation.navigate('Install', {
                url: resolved.url,
                title: resolved.customTitle,
                image: resolved.customImage
            });
        }

        if (resolved.type === 'tx') {
            const hideloader = loader.show();

            let lt = resolved.lt;
            let hash = resolved.hash;

            try {
                if (!!selected?.addressString) {
                    const isSelectedAddress = selected?.address.equals(Address.parse(resolved.address));
                    const queryCache = queryClient.getQueryCache();
                    let txs = getQueryData<InfiniteData<StoredTransaction[]>>(queryCache, Queries.Transactions(resolved.address));
                    let tx = txs?.pages?.flat()?.find(tx => (tx.lt === lt && tx.hash === hash));

                    if (!tx) {
                        // If transaction is not found in the list, invalidate the cache and try to fetch it again
                        await queryClient.invalidateQueries({
                            queryKey: Queries.Transactions(resolved.address),
                            refetchPage: (last, index, allPages) => index == 0,
                        });

                        txs = getQueryData<InfiniteData<StoredTransaction[]>>(queryCache, Queries.Transactions(resolved.address));
                        tx = txs?.pages?.flat()?.find(tx => (tx.lt === lt && tx.hash === hash));
                    }

                    // If transaction is not found in the list, fetch it from the server
                    if (!tx) {
                        // Try to fetch transaction from the server
                        const rawTxs = await infoBackoff('tx', async () => await fetchAccountTransactions(selected.addressString, isTestnet, { lt, hash }));;
                        if (rawTxs.length > 0) {
                            tx = rawTxs[0];
                        }
                    }

                    if (!!tx) {
                        // Fetch metadata for all mentioned addresses
                        const metadatas = (await Promise.all(
                            tx.parsed.mentioned.map(async (address) => {
                                return await queryClient.fetchQuery({
                                    queryKey: Queries.ContractMetadata(address),
                                    queryFn: contractMetadataQueryFn(isTestnet, address),
                                });
                            })
                        ));

                        // Find metadata for the base address
                        const metadata = metadatas.find(m => m?.address === tx!.parsed.resolvedAddress) ?? null;
                        const parsedMetadata = metadata ? parseStoredMetadata(metadata) : null;
                        const jettonMaster = getJettonMasterAddressFromMetadata(metadata);
                        // Fetch jetton master content
                        const masterContent = jettonMaster
                            ? await queryClient.fetchQuery({
                                queryKey: Queries.Jettons().MasterContent(jettonMaster),
                                queryFn: jettonMasterContentQueryFn(jettonMaster, isTestnet),
                            })
                            : null;

                        // Create tx param body
                        const transaction = {
                            id: `${tx.lt}_${tx.hash}`,
                            base: tx,
                            icon: masterContent?.image?.preview256 ?? null,
                            masterMetadata: masterContent,
                            masterAddressStr: jettonMaster,
                            metadata: parsedMetadata,
                            verified: null,
                            op: null,
                            title: null
                        };

                        // If transaction is for the selected address, navigate to it
                        if (isSelectedAddress) {
                            navigation.navigate('Transaction', { transaction });
                        } else { // If transaction is for another address, navigate to the address first
                            const appState = getAppState();
                            const address = Address.parse(resolved.address);
                            const index = appState.addresses.findIndex((a) => a.address.equals(address));


                            // If address is found, select it
                            if (index !== -1) {
                                // Select new address
                                updateAppState({ ...appState, selected: index }, isTestnet);

                                // navigate to home with tx to be opened after
                                navigation.navigateAndReplaceHome({ navigateTo: { type: 'tx', transaction } });
                            }

                        }
                    }
                }
            } catch {
                throw Error('Failed to resolve transaction link');
            } finally {
                // Hide loader
                hideloader();
            }
        }
    }, [selected, updateAppState]);

    return handler;
}
