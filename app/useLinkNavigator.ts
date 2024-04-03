import * as React from 'react';
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
import { TransactionDescription } from './engine/types';
import { getAppState } from './storage/appState';

export function useLinkNavigator(isTestnet: boolean) {
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const txs = useAccountTransactions(selected?.addressString ?? '', { refetchOnMount: true });

    const handler = React.useCallback(async (resolved: ResolvedUrl) => {
        console.log('resolved', resolved);
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
            let lt = resolved.lt;
            let hash = resolved.hash;
            if (!!selected?.addressString) {
                console.log('here');
                const isSelectedAddress = resolved.address === selected?.addressString;
                let transaction = isSelectedAddress ? txs.data?.find(tx => tx.id === `${lt}_${hash}`) : undefined;

                if (!transaction) {
                    console.log('here_0');
                    const rawTxs = await fetchAccountTransactions(resolved.address, isTestnet, { lt, hash });
                    console.log('here_1');
                    if (rawTxs.length > 0) {
                        const base = rawTxs[0];

                        console.log('here_2');
                        const metadatas = (await Promise.all(base.parsed.mentioned.map(async (address) => {
                            return await (contractMetadataQueryFn(client, isTestnet, address)());
                        })));
                        console.log('here_3');

                        // todo set queryData for all metadatas & jettonMasterContents
                        const metadata = metadatas.find(m => m?.address === base.parsed.resolvedAddress) ?? null;
                        const parsedMetadata = metadata ? parseStoredMetadata(metadata) : null;
                        const jettonMaster = getJettonMasterAddressFromMetadata(metadata);
                        const masterContent = jettonMaster ? await jettonMasterContentQueryFn(jettonMaster, isTestnet)() : null;

                        console.log('here_4');

                        transaction = {
                            id: `${base.lt}_${base.hash}`,
                            base: base,
                            icon: masterContent?.image?.preview256 ?? null,
                            masterMetadata: masterContent,
                            metadata: parsedMetadata,
                            verified: null,
                            op: null,
                            title: null,
                            outMessagesCount: base.outMessagesCount,
                            outMessages: base.outMessages,
                        }
                    }
                }

                if (transaction) {
                    // 45613822000001
                    // UUOoyt9juddOFrYQlom6bQjLS95OgchxSGHrthCRfL8=
                    if (isSelectedAddress) {
                        navigation.navigate('Transaction', { transaction });
                    } else {
                        const appState = getAppState();
                        const address = Address.parse(resolved.address);
                        const index = appState.addresses.findIndex((a) => a.address.equals(address));

                        updateAppState({ ...appState, selected: index }, isTestnet);

                        // TODO pass transaction to the new screen as navigation params
                        navigation.navigateAndReplaceAll('Home');
                    }
                }
            }
        }
    }, [txs, updateAppState]);

    return handler;
}
