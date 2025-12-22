import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View } from "react-native";
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
import { useCallback, useRef, useState, useEffect } from 'react';
import { useEthena, useSelectedAccount, useSetAppState, useSolanaSelectedAccount, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useSetNetwork } from '../../engine/hooks';
import { onAccountTouched } from '../../engine/effects/onAccountTouched';
import { AppState, getAppState, setAppState } from '../../storage/appState';
import { useClearHolders } from '../../engine/hooks';
import { useHoldersAccounts } from '../../engine/hooks';
import { useHoldersAccountStatus } from '../../engine/hooks';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { queryClient } from '../../engine/clients';
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
import { useWebViewPreloader } from '../../components/WebViewPreloaderContext';
import { ethereumPrivateKeyFromMnemonic } from '../../utils/ethereum/address';
import { BiometricsState, encryptData, getBiometricsState, getPasscodeState, PasscodeState } from '../../storage/secureStorage';
import {
    getEthBalance,
    formatEthBalance,
    createSelfTransferTransaction,
    sendRawTransaction,
    waitForTransaction
} from '../../utils/ethereum/transactions';

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
    const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [ethTxStatus, setEthTxStatus] = useState<string | null>(null);

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

    const loadEthereumAddress = useCallback(async () => {
        try {
            const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
            if (walletKeys.ethKeyPair) {
                setEthereumAddress(walletKeys.ethKeyPair.address);
            } else {
                Alert.alert(t('common.error'), 'Ethereum wallet not created');
            }
        } catch (e) {
            warn('Failed to load Ethereum address');
            Alert.alert(t('common.error'), t('errors.unknown'));
        }
    }, [authContext, theme.surfaceOnBg]);

    const copyEthereumAddress = useCallback(() => {
        if (ethereumAddress) {
            Clipboard.setString(ethereumAddress);
            if (Platform.OS === 'android') {
                ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    }, [ethereumAddress]);

    const hasEthereumWallet = !!acc.ethereumSecretKeyEnc;

    const createEthereumWallet = useCallback(async () => {
        try {
            // Check authentication method
            const passcodeState = getPasscodeState();
            const biometricsState = getBiometricsState();
            const useBiometrics = biometricsState === BiometricsState.InUse;

            let walletKeys: WalletKeys;
            let ethereumSecretKeyEnc: Buffer;

            // Generate Ethereum private key from mnemonic
            if (useBiometrics) {
                // Use biometrics authentication
                walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
                const ethereumPrivateKey = await ethereumPrivateKeyFromMnemonic(walletKeys.mnemonics);
                ethereumSecretKeyEnc = await encryptData(Buffer.from(ethereumPrivateKey));
            } else if (passcodeState === PasscodeState.Set) {
                // Use passcode authentication
                const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });
                walletKeys = authResult.keys;
                const ethereumPrivateKey = await ethereumPrivateKeyFromMnemonic(walletKeys.mnemonics);
                ethereumSecretKeyEnc = await encryptData(Buffer.from(ethereumPrivateKey), authResult.passcode);
            } else {
                throw new Error('No authentication method available');
            }

            // Update appState with the new Ethereum key
            const appState = getAppState();
            const updatedAddresses = appState.addresses.map((address, index) => {
                if (index === appState.selected) {
                    return {
                        ...address,
                        ethereumSecretKeyEnc
                    };
                }
                return address;
            });

            setAppState({
                ...appState,
                addresses: updatedAddresses
            }, isTestnet);

            // Reload to get the new ethKeyPair and display address
            const updatedWalletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
            if (updatedWalletKeys.ethKeyPair) {
                setEthereumAddress(updatedWalletKeys.ethKeyPair.address);
            }

            if (Platform.OS === 'android') {
                ToastAndroid.show('Ethereum wallet created', ToastAndroid.SHORT);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            warn('Failed to create Ethereum wallet');
            Alert.alert(t('common.error'), t('errors.unknown'));
        }
    }, [authContext, theme.surfaceOnBg, isTestnet]);

    const fetchEthBalanceAndTest = useCallback(async () => {
        try {
            setEthTxStatus('Authenticating...');
            const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });

            if (!walletKeys.ethKeyPair) {
                Alert.alert(t('common.error'), 'Ethereum wallet not created');
                setEthTxStatus(null);
                return;
            }

            const { address, privateKey } = walletKeys.ethKeyPair;

            // Fetch balance
            setEthTxStatus('Fetching balance...');
            const balance = await getEthBalance(address, isTestnet);
            const formattedBalance = formatEthBalance(balance);
            setEthBalance(formattedBalance);

            if (balance === 0n) {
                setEthTxStatus('Balance is 0');
                Alert.alert(
                    'ETH Balance',
                    `Balance: ${formattedBalance} ETH\n\nNo funds to test transaction.${isTestnet ? '\n\nGet testnet ETH from a Sepolia faucet.' : ''}`
                );
                return;
            }

            // Ask if user wants to send test transaction
            Alert.alert(
                'ETH Balance',
                `Balance: ${formattedBalance} ETH\n\nDo you want to send a test transaction (1 wei) to yourself?`,
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                        onPress: () => setEthTxStatus(null)
                    },
                    {
                        text: 'Send Test TX',
                        onPress: async () => {
                            try {
                                // Create and sign transaction
                                setEthTxStatus('Creating transaction...');
                                const { signedTx, tx } = await createSelfTransferTransaction(
                                    address,
                                    privateKey,
                                    isTestnet
                                );

                                // Send transaction
                                setEthTxStatus('Sending transaction...');
                                const txHash = await sendRawTransaction(signedTx, isTestnet);

                                setEthTxStatus(`TX sent: ${txHash.slice(0, 10)}...`);

                                // Wait for confirmation
                                setEthTxStatus('Waiting for confirmation...');
                                const receipt = await waitForTransaction(txHash, isTestnet, 120000);

                                const success = receipt.status === '0x1';
                                setEthTxStatus(success ? 'TX confirmed!' : 'TX failed');

                                // Refresh balance
                                const newBalance = await getEthBalance(address, isTestnet);
                                setEthBalance(formatEthBalance(newBalance));

                                Alert.alert(
                                    success ? 'Transaction Successful' : 'Transaction Failed',
                                    `TX Hash: ${txHash}\n\nGas Used: ${parseInt(receipt.gasUsed, 16)}\nBlock: ${parseInt(receipt.blockNumber, 16)}`,
                                    [
                                        {
                                            text: 'Copy TX Hash',
                                            onPress: () => {
                                                Clipboard.setString(txHash);
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            }
                                        },
                                        { text: 'OK' }
                                    ]
                                );
                            } catch (txError: any) {
                                setEthTxStatus('TX failed');
                                Alert.alert('Transaction Error', txError.message || 'Unknown error');
                            }
                        }
                    }
                ]
            );
        } catch (e: any) {
            warn('Failed to fetch ETH balance');
            setEthTxStatus(null);
            Alert.alert(t('common.error'), e.message || t('errors.unknown'));
        }
    }, [authContext, theme.surfaceOnBg, isTestnet]);

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
                        padding: 4
                    }}>
                        {!hasEthereumWallet ? (
                            <ItemButton title={'Create Ethereum wallet'} onPress={createEthereumWallet} />
                        ) : ethereumAddress ? (
                            <>
                                <ItemButton
                                    title={'Ethereum address'}
                                    hint={`${ethereumAddress.slice(0, 8)}...${ethereumAddress.slice(-6)}`}
                                    onPress={copyEthereumAddress}
                                />
                                <ItemButton
                                    title={'Test ETH Transfer'}
                                    hint={ethBalance ? `${ethBalance} ETH${ethTxStatus ? ` • ${ethTxStatus}` : ''}` : (ethTxStatus || 'Fetch balance & test')}
                                    onPress={fetchEthBalanceAndTest}
                                />
                            </>
                        ) : (
                            <ItemButton title={'Load Ethereum address'} onPress={loadEthereumAddress} />
                        )}
                    </View>
                    {__DEV__ && (
                        <View style={{
                            backgroundColor: theme.border,
                            borderRadius: 14,
                            overflow: 'hidden',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 4
                        }}>
                            <ItemButton title={"Holders AI Chat"} onPress={() => navigation.navigate('HoldersAIChat')} />
                            <ItemButton title={"Holders AI Chat"} onPress={() => {
                                navigation.navigate('HoldersAIChat', { initMessage: { type: 'message', message: 'Hello, how are you?' } })
                            }} />
                        </View>
                    )}
                    <WebView webviewDebuggingEnabled={isTestnet} ref={webViewRef} source={{ uri: holdersUrl(isTestnet) }} style={{ width: 0, height: 0 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});