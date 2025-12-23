import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View, Text, ActivityIndicator, Pressable } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { fragment } from '../../fragment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useState, useEffect } from 'react';
import { useSelectedAccount, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { getAppState, setAppState } from '../../storage/appState';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ethereumPrivateKeyFromMnemonic } from '../../utils/ethereum/address';
import { BiometricsState, encryptData, getBiometricsState, getPasscodeState, PasscodeState } from '../../storage/secureStorage';
import {
    getEthBalance,
    formatEthBalance,
    createSelfTransferTransaction,
    sendRawTransaction,
    waitForTransaction
} from '../../utils/ethereum/transactions';
import { useSetAppState } from '../../engine/hooks';

export const EthereumFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const acc = useSelectedAccount()!;
    const setAppStateHook = useSetAppState();

    const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [ethTxStatus, setEthTxStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    const hasEthereumWallet = !!acc.ethereumSecretKeyEnc;

    const loadEthereumAddress = useCallback(async () => {
        try {
            setIsLoading(true);
            const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
            if (walletKeys.ethKeyPair) {
                setEthereumAddress(walletKeys.ethKeyPair.address);
                return walletKeys.ethKeyPair.address;
            } else {
                Alert.alert(t('common.error'), 'Ethereum wallet not created');
                return null;
            }
        } catch (e) {
            warn('Failed to load Ethereum address');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [authContext, theme.surfaceOnBg]);

    const fetchBalance = useCallback(async (address: string) => {
        try {
            setIsBalanceLoading(true);
            const balance = await getEthBalance(address, isTestnet);
            const formattedBalance = formatEthBalance(balance);
            setEthBalance(formattedBalance);
        } catch (e) {
            warn('Failed to fetch ETH balance');
            setEthBalance(null);
        } finally {
            setIsBalanceLoading(false);
        }
    }, [isTestnet]);

    // Auto-load address and balance when wallet exists
    useEffect(() => {
        if (hasEthereumWallet && !ethereumAddress && !isLoading) {
            loadEthereumAddress().then((addr) => {
                if (addr) {
                    fetchBalance(addr);
                }
            });
        }
    }, [hasEthereumWallet]);

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

            setAppStateHook({
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
    }, [authContext, theme.surfaceOnBg, isTestnet, setAppStateHook]);

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

    const navigateToPrivateKey = useCallback(() => {
        navigation.navigate('EthereumSeed');
    }, [navigation]);

    return (
        <View style={{ flexGrow: 1, paddingTop: 32 }}>
            <ScreenHeader 
                style={{ paddingHorizontal: 16 }} 
                onBackPressed={navigation.goBack} 
                title={'Ethereum'} 
            />
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
                    {!hasEthereumWallet ? (
                        <View style={{
                            backgroundColor: theme.border,
                            borderRadius: 14,
                            overflow: 'hidden',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 4
                        }}>
                            <ItemButton title={'Create Ethereum wallet'} onPress={createEthereumWallet} />
                        </View>
                    ) : (
                        <>
                            {/* Wallet Card */}
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 20,
                                padding: 20,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}>
                                {/* Network Badge */}
                                <View style={{
                                    backgroundColor: isTestnet ? theme.accentOrange : theme.accent,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    alignSelf: 'flex-start',
                                    marginBottom: 16
                                }}>
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: '600'
                                    }}>
                                        {isTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
                                    </Text>
                                </View>

                                {/* Balance */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        color: theme.textSecondary,
                                        fontSize: 14,
                                        fontWeight: '500',
                                        marginBottom: 4
                                    }}>
                                        {'Balance'}
                                    </Text>
                                    {isLoading || isBalanceLoading ? (
                                        <ActivityIndicator size="small" color={theme.accent} />
                                    ) : (
                                        <Pressable onPress={() => ethereumAddress && fetchBalance(ethereumAddress)}>
                                            <Text style={{
                                                color: theme.textPrimary,
                                                fontSize: 32,
                                                fontWeight: '700',
                                                lineHeight: 38
                                            }}>
                                                {ethBalance !== null ? `${ethBalance} ETH` : '—'}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>

                                {/* Address */}
                                <View>
                                    <Text style={{
                                        color: theme.textSecondary,
                                        fontSize: 14,
                                        fontWeight: '500',
                                        marginBottom: 4
                                    }}>
                                        {'Address'}
                                    </Text>
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={theme.accent} />
                                    ) : ethereumAddress ? (
                                        <Pressable onPress={copyEthereumAddress}>
                                            <Text style={{
                                                color: theme.textPrimary,
                                                fontSize: 14,
                                                fontWeight: '500',
                                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                                lineHeight: 20
                                            }}>
                                                {ethereumAddress}
                                            </Text>
                                            <Text style={{
                                                color: theme.accent,
                                                fontSize: 12,
                                                fontWeight: '500',
                                                marginTop: 4
                                            }}>
                                                {'Tap to copy'}
                                            </Text>
                                        </Pressable>
                                    ) : (
                                        <Text style={{
                                            color: theme.textSecondary,
                                            fontSize: 14,
                                        }}>
                                            {'Loading...'}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={{
                                backgroundColor: theme.border,
                                borderRadius: 14,
                                overflow: 'hidden',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 4
                            }}>
                                <ItemButton
                                    title={'Refresh Balance'}
                                    hint={isBalanceLoading ? 'Loading...' : undefined}
                                    onPress={() => ethereumAddress && fetchBalance(ethereumAddress)}
                                />
                                <ItemButton
                                    title={'Test ETH Transfer'}
                                    hint={ethTxStatus || 'Send 1 wei to yourself'}
                                    onPress={fetchEthBalanceAndTest}
                                />
                            </View>

                            {/* Export */}
                            <View style={{
                                backgroundColor: theme.border,
                                borderRadius: 14,
                                overflow: 'hidden',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 4
                            }}>
                                <ItemButton
                                    title={'View Private Key'}
                                    hint={'Export for MetaMask'}
                                    onPress={navigateToPrivateKey}
                                />
                            </View>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});

