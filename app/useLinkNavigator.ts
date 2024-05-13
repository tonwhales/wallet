import { Alert } from 'react-native';
import { t } from './i18n/t';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useAccountTransactions, useClient4, useSetAppState } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { jettonWalletAddressQueryFn } from './engine/hooks/jettons/useJettonWalletAddress';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { fetchAccountTransactions } from './engine/api/fetchAccountTransactions';
import { contractMetadataQueryFn, jettonMasterContentQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from './engine/hooks/transactions/useAccountTransactions';
import { getAppState } from './storage/appState';
import { useGlobalLoader } from './components/useGlobalLoader';
import { useCallback } from 'react';

export function useLinkNavigator(isTestnet: boolean) {
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const txs = useAccountTransactions(selected?.addressString ?? '', { refetchOnMount: true });
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

            // TODO: replace with getter
            const jettonWallet = await queryClient.fetchQuery({
                queryKey: Queries.Jettons().Address(selected!.addressString).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                queryFn: jettonWalletAddressQueryFn(client, resolved.jettonMaster.toString({ testOnly: isTestnet }), selected!.addressString, isTestnet)
            });

            if (!jettonWallet) {
                Alert.alert(t('transfer.wrongJettonTitle'), t('transfer.wrongJettonMessage'));
                return;
            }

            navigation.navigateSimpleTransfer({
                target: resolved.address.toString({ testOnly: isTestnet }),
                comment: resolved.comment,
                amount: resolved.amount,
                stateInit: null,
                job: null,
                jetton: Address.parse(jettonWallet),
                callback: null
            });
        }
        if (resolved.type === 'connect') {
            navigation.navigate('Authenticate', {
                session: resolved.session,
                endpoint: resolved.endpoint
            });
        }
        if (resolved.type === 'tonconnect') {
            navigation.navigate('TonConnectAuthenticate', { query: resolved.query, type: 'qr' });
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
                    let transaction = isSelectedAddress ? txs.data?.find(tx => tx.id === `${lt}_${hash}`) : undefined;

                    // If transaction is not found in the list, fetch it from the server
                    if (!transaction) {
                        const rawTxs = await fetchAccountTransactions(resolved.address, isTestnet, { lt, hash });
                        if (rawTxs.length > 0) {
                            const base = rawTxs[0];

                            // Fetch metadata for all mentioned addresses
                            const metadatas = (await Promise.all(base.parsed.mentioned.map(async (address) => {
                                return await (contractMetadataQueryFn(client, isTestnet, address)());
                            })));

                            // Find metadata for the base address
                            const metadata = metadatas.find(m => m?.address === base.parsed.resolvedAddress) ?? null;
                            const parsedMetadata = metadata ? parseStoredMetadata(metadata) : null;
                            const jettonMaster = getJettonMasterAddressFromMetadata(metadata);
                            // Fetch jetton master content
                            const masterContent = jettonMaster ? await jettonMasterContentQueryFn(jettonMaster, isTestnet)() : null;

                            transaction = {
                                id: `${base.lt}_${base.hash}`,
                                base: base,
                                icon: masterContent?.image?.preview256 ?? null,
                                masterMetadata: masterContent,
                                masterAddressStr: jettonMaster,
                                metadata: parsedMetadata,
                                verified: null,
                                op: null,
                                title: null
                            };
                        }
                    }

                    // If transaction is found, navigate to it
                    if (transaction) {

                        // If transaction is for the selected address, navigate to it
                        if (isSelectedAddress) {
                            navigation.navigate('Transaction', { transaction });
                        } else { // If transaction is for another address, navigate to the address first
                            const appState = getAppState();
                            const address = Address.parse(resolved.address);
                            const index = appState.addresses.findIndex((a) => a.address.equals(address));

                            updateAppState({ ...appState, selected: index }, isTestnet);

                            navigation.navigateAndReplaceHome({ navigateTo: { type: 'tx', transaction } });
                        }
                    }
                }
            } catch {
                throw Error('Failed to resolve transaction link');
            } finally {
                hideloader();
            }

        }
    }, [txs, updateAppState]);

    return handler;
}
