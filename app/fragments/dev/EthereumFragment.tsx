import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View, Text, ActivityIndicator, Pressable } from "react-native";
import { fragment } from '../../fragment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useState, useEffect } from 'react';
import { useSelectedAccount, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
    getEthBalance,
    formatEthBalance,
    createSelfTransferTransaction,
    sendRawTransaction,
    waitForTransaction
} from '../../utils/ethereum/transactions';
import { RoundButton } from '../../components/RoundButton';
import { Typography } from '../../components/styles';

export const EthereumFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const acc = useSelectedAccount()!;

    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [ethTxStatus, setEthTxStatus] = useState<string | null>(null);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    // Get ethereum address directly from app state - no auth needed
    const ethereumAddress = acc.ethereum?.address ?? null;
    const hasEthereumWallet = !!acc.ethereum;

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

    // Auto-load balance when wallet exists
    useEffect(() => {
        if (ethereumAddress) {
            fetchBalance(ethereumAddress);
        }
    }, [ethereumAddress]);

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

    const navigateToCreateUniversalWallet = useCallback(() => {
        navigation.navigate('UniversalWalletCreate');
    }, [navigation]);

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

    const navigateToSend = useCallback(() => {
        navigation.navigate('EthereumSend');
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
                            <RoundButton
                                title={'Create Universal Wallet'}
                                onPress={navigateToCreateUniversalWallet}
                            />
                        </View>
                    ) : (
                        <>
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
                                <View style={{
                                    backgroundColor: theme.accent,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    alignSelf: 'flex-start',
                                    marginBottom: 16
                                }}>
                                    <Text style={[{
                                        color: '#fff'
                                    }, Typography.medium10_12]}>
                                        {isTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
                                    </Text>
                                </View>
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={[{
                                        color: theme.textSecondary,
                                        marginBottom: 4
                                    }, Typography.medium13_18]}>
                                        {'Balance'}
                                    </Text>
                                    {isBalanceLoading ? (
                                        <ActivityIndicator size="small" color={theme.accent} />
                                    ) : (
                                        <Pressable onPress={() => ethereumAddress && fetchBalance(ethereumAddress)}>
                                            <Text style={[{
                                                color: theme.textPrimary
                                            }, Typography.semiBold32_38]}>
                                                {ethBalance !== null ? `${ethBalance} ETH` : '—'}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                                <View>
                                    <Text style={[{
                                        color: theme.textSecondary,
                                        marginBottom: 4
                                    }, Typography.medium13_18]}>
                                        {'Address'}
                                    </Text>
                                    <Pressable onPress={copyEthereumAddress}>
                                        <Text style={[{
                                            color: theme.textPrimary,
                                        }, Typography.medium15_20]}>
                                            {ethereumAddress}
                                        </Text>
                                        <Text style={[{
                                            color: theme.accent,
                                            marginTop: 4
                                        }, Typography.medium13_18]}>
                                            {'Tap to copy'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                            <RoundButton
                                title={'Send ETH'}
                                onPress={navigateToSend}
                            />
                            <View style={{
                                flexDirection: 'row',
                                gap: 8,
                                overflow: 'hidden',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <RoundButton
                                    title={'Refresh Balance'}
                                    display={'secondary'}
                                    onPress={() => ethereumAddress && fetchBalance(ethereumAddress)}
                                />
                                <RoundButton
                                    title={'Test ETH Transfer'}
                                    display={'secondary'}
                                    onPress={fetchEthBalanceAndTest}
                                />
                            </View>
                            <RoundButton
                                title={'View Private Key'}
                                onPress={navigateToPrivateKey}
                                display={'secondary'}
                            />
                            <RoundButton
                                title={'Generate new TON + Ethereum wallet'}
                                onPress={navigateToCreateUniversalWallet}
                            />
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});

