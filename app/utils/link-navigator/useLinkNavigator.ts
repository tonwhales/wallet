import { useTypedNavigation } from '../useTypedNavigation';
import { useClient4, useConfig, useConnectPendingRequests, useSetAppState } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { useGlobalLoader } from '../../components/useGlobalLoader';
import { TonConnectAuthType } from '../../fragments/secure/dapps/TonConnectAuthenticateFragment';
import { warn } from '../log';
import { Linking } from 'react-native';
import { openWithInApp } from '../openWithInApp';
import { useLedgerTransport } from '../../fragments/ledger/components/TransportContext';
import { ResolvedUrl } from '../url/types';
import { tryResolveTonconnectRequest } from './tryResolveTonconnectRequest';
import { resolveAndNavigateToJettonTransfer } from './resolveAndNavigateToJettonTransfer';
import { resolveAndNavigateToHolders } from './resolveAndNavigateToHolders';
import { resolveAndNavigateToSolanaTransfer } from './resolveAndNavigateToSolanaTransfer';
import { resolveAndNavigateToTransaction } from './resolveAndNavigateToTransaction';
import { storeInviteId } from '../holders/storage';
import { resolveHoldersInviteLink } from './resolveHoldersInviteLink';
import { resolveAndNavigateToDomainTransfer } from './resolveAndNavigateToDomainTransfer';
import { resolveAndNavigateToTransfer } from './resolveAndNavigateToTransfer';
import { getTimeSec } from '../getTimeSec';
import { t } from '../../i18n/t';

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number },
    tonconnectType: TonConnectAuthType = TonConnectAuthType.Qr,
    isLedger?: boolean
) {
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const client = useClient4(isTestnet);
    const toaster = useToaster();
    const loader = useGlobalLoader();
    const ledgerContext = useLedgerTransport();
    const netConfig = useConfig();
    const address = isLedger ? ledgerContext.addr!.address : selected?.addressString;

    const [, updatePendingReuests] = useConnectPendingRequests();
    const pendingReqsUpdaterRef = useRef(updatePendingReuests);

    useEffect(() => {
        pendingReqsUpdaterRef.current = updatePendingReuests;
    }, [updatePendingReuests]);

    const handler = useCallback(async (resolved: ResolvedUrl) => {
        const isTonTx =
            resolved.type === 'transaction'
            || resolved.type === 'jetton-transaction'
            || resolved.type === 'domain-transfer'
            || resolved.type === 'domain-jetton-transfer';

        if (isTonTx) {
            // check validUntil
            if (resolved.expiresAt && resolved.expiresAt < getTimeSec()) {
                toaster.show({
                    message: t('products.transactionRequest.expired'),
                    ...toastProps, type: 'error'
                });
                return;
            }
            // check if has comment and bin & show error
            if (resolved.comment && resolved.payload) {
                toaster.show({
                    message: t('products.transactionRequest.invalidRequest'),
                    ...toastProps, type: 'error'
                });
                return;
            }
        }

        switch (resolved.type) {
            case 'transaction': {
                resolveAndNavigateToTransfer({
                    resolved,
                    isTestnet,
                    isLedger,
                    navigation,
                })
                break;
            }
            case 'jetton-transaction': {
                if (!address) {
                    return;
                }

                await resolveAndNavigateToJettonTransfer({
                    resolved,
                    isTestnet,
                    address,
                    queryClient,
                    toaster,
                    loader,
                    navigation,
                    toastProps,
                    isLedger
                });
                break;
            }
            case 'domain-jetton-transfer':
            case 'domain-transfer': {
                if (!address) {
                    return;
                }
                resolveAndNavigateToDomainTransfer({
                    resolved,
                    isTestnet,
                    client,
                    navigation,
                    loader,
                    toaster,
                    toastProps,
                    isLedger,
                    queryClient,
                    netConfig,
                    ownerAddress: address
                });
                break;
            }
            case 'connect': {
                navigation.navigate('Authenticate', {
                    session: resolved.session,
                    endpoint: resolved.endpoint
                });
                break;
            }
            case 'tonconnect': {
                if (tonconnectType === TonConnectAuthType.Qr || tonconnectType === TonConnectAuthType.Link) {
                    navigation.navigateConnectAuth({ query: resolved.query, type: tonconnectType });
                } else { // Callback only support in injectedBridge
                    warn(`Unsupported TonConnectAuthType ${tonconnectType}`);
                }
                break;
            }
            case 'install': {
                navigation.navigate('Install', {
                    url: resolved.url,
                    title: resolved.customTitle,
                    image: resolved.customImage
                });
                break;
            }
            case 'tx': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToTransaction({
                    resolved,
                    isTestnet,
                    selected,
                    queryClient,
                    loader,
                    navigation,
                    updateAppState
                });
                break;
            }
            case 'tonconnect-request': {
                tryResolveTonconnectRequest({
                    query: resolved.query,
                    isTestnet,
                    toaster,
                    toastProps,
                    navigation,
                    pendingReqsUpdaterRef,
                    updateAppState
                });
                break;
            }
            case 'external-url': {
                Linking.openURL(resolved.url);
                break;
            }
            case 'in-app-url': {
                openWithInApp(resolved.url);
                break;
            }
            case 'holders-transactions': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToHolders({
                    type: 'holders-transactions',
                    navigation,
                    query: resolved.query,
                    selected,
                    updateAppState,
                    isTestnet,
                    queryClient
                });
                break;
            }
            case 'holders-path': {
                if (!selected) {
                    return;
                }

                resolveAndNavigateToHolders({
                    type: 'holders-path',
                    path: resolved.path,
                    navigation,
                    query: resolved.query,
                    selected,
                    updateAppState,
                    isTestnet,
                    queryClient
                });
                break;
            }
            case 'holders-invite': {
                storeInviteId(resolved.inviteId);

                if (!selected) {
                    return;
                }

                resolveHoldersInviteLink({
                    navigation,
                    isTestnet,
                    inviteId: resolved.inviteId
                })
                break;
            }
            case 'solana-transfer': {
                resolveAndNavigateToSolanaTransfer({
                    selected,
                    navigation,
                    isTestnet,
                    request: resolved.request
                });
                break;
            }
        }

    }, [selected, updateAppState, isLedger]);

    return handler;
}