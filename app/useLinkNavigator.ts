import { t } from './i18n/t';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useClient4 } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { ToastDuration, useToaster } from './components/toast/ToastProvider';
import { useCallback } from 'react';
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { useGlobalLoader } from './components/useGlobalLoader';
import { StoredJettonWallet } from './engine/metadata/StoredMetadata';

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number }
) {
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
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
            navigation.navigate('TonConnectAuthenticate', { query: resolved.query, type: 'qr' });
        }
        if (resolved.type === 'install') {
            navigation.navigate('Install', {
                url: resolved.url,
                title: resolved.customTitle,
                image: resolved.customImage
            });
        }
    }, [selected]);

    return handler;
}
