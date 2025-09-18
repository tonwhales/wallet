import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View, Text } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence, storageQuery } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useRef, useState } from 'react';
import { useEthena, useSelectedAccount, useSetAppState, useSolanaSelectedAccount, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useSetNetwork } from '../../engine/hooks';
import { onAccountTouched } from '../../engine/effects/onAccountTouched';
import { AppState, getAppState } from '../../storage/appState';
import { useClearHolders } from '../../engine/hooks';
import { useHoldersAccounts } from '../../engine/hooks';
import { useHoldersAccountStatus } from '../../engine/hooks';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { queryClient, whalesConnectEndpoint } from '../../engine/clients';
import { getCountryCodes } from '../../utils/isNeocryptoAvailable';
import { Item } from '../../components/Item';
import { IosWalletService } from '../../modules/WalletService';
import { useSetHiddenBanners } from '../../engine/hooks/banners/useHiddenBanners';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { Address } from '@ton/core';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { useScreenProtectorState } from '../../engine/hooks/settings/useScreenProtector';
import WebView from 'react-native-webview';
import { holdersUrl } from '../../engine/api/holders/fetchUserState';
import { createLogger } from '../../utils/log';
import { useWebViewPreloader } from '../../components/WebViewPreloaderContext';
import axios from 'axios';
import { useWalletRequestsWatcher } from '../../engine/useWalletRequestsWatcher';
import { Base64 } from '@tonconnect/protocol';
import nacl from 'tweetnacl';
import { sha256_sync } from '@ton/crypto';
import { WalletRequest } from '../../engine/WalletRequestsWatcher';

const logger = createLogger('tonconnect');

function createRequestSignatureMessage(
    requestor: string,
    confirmant: string,
    message: string | undefined,
    expirationSeconds: number = 60 * 5,
    timestamp: number = Math.floor(Date.now() / 1000),
    metadata?: Record<string, any>
): string {
    const parts = [
        'WALLET_REQUEST_CREATE',
        requestor,
        confirmant,
        message || '',
        expirationSeconds.toString(),
        timestamp.toString(),
        metadata ? JSON.stringify(metadata) : ''
    ];

    return parts.join('|');
}

function createResponseSignatureMessage(
    requestId: string,
    walletAddress: string,
    status: string,
    response: string | undefined,
    timestamp: number = Math.floor(Date.now() / 1000)
): string {
    const parts = [
        'WALLET_REQUEST_RESPOND',
        requestId,
        walletAddress,
        status,
        response || '',
        timestamp.toString()
    ];

    return parts.join('|');
}

function signMessage(message: string, authWalletKeys: WalletKeys) {
    const messageBuffer = Buffer.from(message, 'utf-8');
    const messageHash = sha256_sync(messageBuffer);

    console.log('Signing message:', message);
    console.log('Message hash:', messageHash);

    const signed = nacl.sign.detached(
        new Uint8Array(messageHash),
        new Uint8Array(authWalletKeys.keyPair.secretKey),
    );

    return Base64.encode(signed);
}

async function sendConfirmationRequest(authWalletKeys: WalletKeys, requester: string, confirmant: string, message?: string, expirationSeconds?: number, isTestnet?: boolean) {
    const signatureMessage = createRequestSignatureMessage(requester, confirmant, message, expirationSeconds);
    const url = `${whalesConnectEndpoint}/wallet-request/create`;

    const signed = signMessage(signatureMessage, authWalletKeys);

    const body = {
        requestor: requester,
        confirmant: confirmant,
        signature: signed,
        timestamp: Math.floor(Date.now() / 1000),
        network: isTestnet ? 'testnet' : 'mainnet'
    }

    const res = await axios.post(url, body);

    console.log('sendConfirmationRequest', res.data);
    console.log('sendConfirmationRequest', res.status);

    return res.data;
}

async function sendConfirmationResponse(authWalletKeys: WalletKeys, requestId: string, walletAddress: string, status: 'confirmed' | 'declined', response?: string, isTestnet?: boolean) {
    const signature = createResponseSignatureMessage(requestId, walletAddress, status, response);
    const url = `${whalesConnectEndpoint}/wallet-request/respond`;

    const signed = signMessage(signature, authWalletKeys);

    const body = {
        requestId: requestId,
        walletAddress: walletAddress,
        status: status,
        signature: signed,
        timestamp: Math.floor(Date.now() / 1000),
        network: isTestnet ? 'testnet' : 'mainnet'
    }

    const res = await axios.post(url, body);

    console.log('sendConfirmationResponse', res.data);
    console.log('sendConfirmationResponse', res.status);

    return res.data;
}

async function fetchWalletRequests(address: string, isTestnet?: boolean) {
    const url = `${whalesConnectEndpoint}/wallet-request/${address}/${isTestnet ? 'testnet' : 'mainnet'}/list`;
    const res = await axios.get(url);
    console.log('getWalletRequests', res.data);
    console.log('getWalletRequests', res.status);
    return res.data;
}

export const DeveloperToolsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const setNetwork = useSetNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const countryCodes = getCountryCodes();
    const setHiddenBanners = useSetHiddenBanners();
    const ledgerContext = useLedgerTransport();
    const acc = useSelectedAccount()!;
    const solanaAddress = useSolanaSelectedAccount()!;
    const accounts = useHoldersAccounts(acc.address, solanaAddress);
    const holdersStatus = useHoldersAccountStatus(acc.address);
    const setAppState = useSetAppState();
    const [isScreenProtectorEnabled, setScreenProtector] = useScreenProtectorState();
    const webViewRef = useRef<WebView>(null);
    const { clearWebViewLocalStorage } = useWebViewPreloader();
    const ethena = useEthena();

    const reboot = useReboot();
    const clearHolders = useClearHolders(isTestnet);

    const { requests, addRequest, updateRequest, removeRequest, clearRequests } = useWalletRequestsWatcher();
    const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
    const appState = getAppState();
    const addresses = appState.addresses;
    const currentAddress = addresses[appState.selected];
    const requester = addresses[0];
    const confirmant = addresses[1];

    const isConfirmant = confirmant.addressString === currentAddress.addressString;
    const isRequester = requester.addressString === currentAddress.addressString;

    const getWalletRequests = useCallback(async () => {
        const res = await fetchWalletRequests(currentAddress.address.toString({ bounceable: false, testOnly: isTestnet }), isTestnet);
        if (res.requests && res.requests.length > 0) {
            setWalletRequests(res.requests);
        }
    }, [currentAddress.address, isTestnet]);

    const resetCache = useCallback(async () => {
        queryClient.clear();
        queryClient.invalidateQueries();
        storageQuery.clearAll();
        storagePersistence.clearAll();
        clearWebViewLocalStorage();
        setHiddenBanners([]);
        await clearHolders(acc.address.toString({ testOnly: isTestnet }));
        await onAccountTouched(acc.address.toString({ testOnly: isTestnet }), isTestnet, ethena);
        for (const ledgerWalet of ledgerContext.wallets) {
            const address = Address.parse(ledgerWalet.address);
            await clearHolders(address.toString({ testOnly: isTestnet }));
            await onAccountTouched(address.toString({ testOnly: isTestnet }), isTestnet, ethena);
        }
        IosWalletService.setCredentialsInGroupUserDefaults({});
        reboot();
    }, [isTestnet, clearHolders, setHiddenBanners, ledgerContext.wallets, ethena]);

    const onSwitchNetwork = async () => {
        const storedAppState = getAppState();
        const newAppState: AppState = {
            ...storedAppState,
            addresses: await Promise.all(
                storedAppState.addresses.map(async (address) => {
                    const publicKey = address.publicKey
                    // to get the contract address for w5 wallet with correct network
                    const contract = await contractFromPublicKey(publicKey, address.version, !isTestnet);

                    return {
                        address: contract.address,
                        publicKey,
                        secretKeyEnc: address.secretKeyEnc,
                        utilityKey: address.utilityKey,
                        addressString: contract.address.toString({ testOnly: !isTestnet }),
                        version: address.version,
                    }
                })
            )
        };
        setAppState(newAppState, !isTestnet);
        setNetwork(isTestnet ? 'mainnet' : 'testnet');
    }

    const switchNetworkAlert = () => {
        Alert.alert(
            t('devTools.switchNetworkAlertTitle', { network: isTestnet ? 'Mainnet' : 'Testnet' }),
            t('devTools.switchNetworkAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.switchNetworkAlertAction'),
                    onPress: onSwitchNetwork,
                }
            ]
        );
    };

    const copySeed = useCallback(async () => {
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
            const body = walletKeys.mnemonics.join(' ');

            if (Platform.OS === 'android') {
                Clipboard.setString(body);
                ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
                return;
            }
            Clipboard.setString(body);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            warn('Failed to load wallet keys');
            Alert.alert(t('common.error'), t('errors.unknown'));
            return;
        }
    }, [])

    const onExportSeedAlert = useCallback(() => {
        Alert.alert(
            t('devTools.copySeedAlertTitle'),
            t('devTools.copySeedAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.copySeedAlertAction'),
                    onPress: copySeed,
                }
            ]
        );
    }, []);

    const copySolanaPK = useCallback(async () => {
        const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
        const pk = walletKeys.keyPair.secretKey.toString('hex');
        Clipboard.setString(pk);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [acc.publicKey]);

    const onExportSolanaPKAlert = useCallback(() => {
        Alert.alert(
            "Coping private key to clipboard",
            "WARNING! Coping private key to clipboard is not secure. Proceed at your own risk. Use only for export to Phantom wallet (At your own risk)",
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.copySeedAlertAction'),
                    onPress: copySolanaPK,
                }
            ]
        );
    }, []);

    return (
        <View style={{ flexGrow: 1, paddingTop: 32 }}>
            <ScreenHeader style={{ paddingHorizontal: 16 }} onBackPressed={navigation.goBack} title={'Dev Tools'} />
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    flexGrow: 1,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{
                        flexGrow: 1, flexBasis: 0,
                        paddingHorizontal: 16, marginTop: 0
                    }}
                    contentInset={{
                        bottom: safeArea.bottom + 44,
                    }}
                    contentContainerStyle={{ gap: 16 }}
                >
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={'Copy Solana private key'} onPress={onExportSolanaPKAlert} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.switchNetwork')} onPress={switchNetworkAlert} hint={isTestnet ? 'Testnet' : 'Mainnet'} />
                        </View>
                        {Platform.OS === 'android' && (
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton title={'Screen protector'} onPress={() => setScreenProtector(value => !value)} hint={isScreenProtectorEnabled ? 'Enabled' : 'Disabled'} />
                            </View>
                        )}
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch cards'}
                                onPress={() => {
                                    accounts.refetch();
                                }}
                            />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch status'}
                                hint={holdersStatus.data?.state}
                                onPress={() => {
                                    holdersStatus.refetch();
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Dev WebView'}
                                onPress={() => {
                                    navigation.navigate('DevDAppWebView');
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Open LedgerSignData'}
                                onPress={() => {
                                    navigation.navigate('LedgerSignData');
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4
                    }}>
                        <Item title={"Store code"} hint={countryCodes.storeFrontCode ?? 'Not availible'} />
                        <Item title={"Country code"} hint={countryCodes.countryCode} />
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 16
                    }}>
                        <Text style={{ color: theme.textPrimary }}>
                            {isRequester ? '[Requester]' : '[Confirmant]'}
                        </Text>
                        {isRequester && <ItemButton
                            title={"Send request"}
                            onPress={async () => {
                                try {
                                    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
                                    console.log('pub key:', walletKeys.keyPair.publicKey.toString('hex'));
                                    const normalizedRequester = requester.address.toString({ bounceable: false, testOnly: isTestnet });
                                    const normalizedConfirmant = confirmant.address.toString({ bounceable: false, testOnly: isTestnet });
                                    const res = await sendConfirmationRequest(walletKeys, normalizedRequester, normalizedConfirmant, undefined, undefined, isTestnet);
                                    console.log(res.status);
                                    console.log('request sent');
                                } catch (e) {
                                    console.log(`[Send request] ${(e as Error).message}`);
                                }
                            }}
                        />}
                        {isConfirmant && <ItemButton
                            title={"Send response"}
                            onPress={async () => {
                                try {
                                    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
                                    const normalizedConfirmant = confirmant.address.toString({ bounceable: false, testOnly: isTestnet });
                                    const res = await sendConfirmationResponse(walletKeys, requests[0].requestId, normalizedConfirmant, 'confirmed', undefined, isTestnet);
                                    console.log(res.status);
                                    console.log('response sent');
                                } catch (e) {
                                    console.log(`[Send response] ${JSON.stringify(e)}`);
                                }
                            }}
                        />}
                        <Text style={{ color: theme.textPrimary }}>
                            {'Requests watcher:'}
                        </Text>
                        <Text style={{ color: theme.textPrimary }}>
                            {requests.map(request => `${request.requestId}: ${request.status}`).join('\n')}
                        </Text>
                        <ItemButton
                            title={'Fetch requests'}
                            onPress={getWalletRequests}
                        />
                        <Text style={{ color: theme.textPrimary }}>
                            {walletRequests.map(request => `${request.requestId}: ${request.status}`).join('\n')}
                        </Text>
                    </View>
                    <WebView webviewDebuggingEnabled={isTestnet} ref={webViewRef} source={{ uri: holdersUrl(isTestnet) }} style={{ width: 0, height: 0 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});