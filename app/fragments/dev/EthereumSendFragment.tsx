import * as React from 'react';
import { Alert, Platform, ScrollView, View, Text, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { fragment } from '../../fragment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSelectedAccount, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
    getEthBalance,
    formatEthBalance,
    createEthTransferTransaction,
    sendRawTransaction,
    waitForTransaction,
    parseEthToWei,
    isValidEthereumAddress,
    estimateTransactionFee
} from '../../utils/ethereum/transactions';
import { RoundButton } from '../../components/RoundButton';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';

type SendState =
    | { type: 'idle' }
    | { type: 'loading', message: string }
    | { type: 'success', txHash: string }
    | { type: 'error', message: string };

export const EthereumSendFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const acc = useSelectedAccount()!;

    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
    const [sendState, setSendState] = useState<SendState>({ type: 'idle' });

    const addressInputRef = useRef<ATextInputRef>(null);
    const amountInputRef = useRef<ATextInputRef>(null);

    // Get ethereum address directly from app state
    const ethereumAddress = acc.ethereum?.address ?? null;
    const hasEthereumWallet = !!acc.ethereum;

    // Fetch balance on mount
    useEffect(() => {
        if (ethereumAddress) {
            (async () => {
                try {
                    const balance = await getEthBalance(ethereumAddress, isTestnet);
                    setEthBalance(formatEthBalance(balance));
                } catch (e) {
                    warn('Failed to fetch ETH balance');
                }
            })();
        }
    }, [ethereumAddress, isTestnet]);

    // Estimate fee on mount
    useEffect(() => {
        (async () => {
            try {
                const fee = await estimateTransactionFee(isTestnet);
                setEstimatedFee(fee);
            } catch (e) {
                warn('Failed to estimate fee');
            }
        })();
    }, [isTestnet]);

    const isAddressValid = isValidEthereumAddress(toAddress);
    const isAmountValid = amount.length > 0 && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
    const canSend = isAddressValid && isAmountValid && sendState.type === 'idle';

    const handlePasteAddress = useCallback(async () => {
        const clipboardContent = await Clipboard.getString();
        if (clipboardContent && isValidEthereumAddress(clipboardContent)) {
            setToAddress(clipboardContent);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const handleMaxAmount = useCallback(() => {
        if (ethBalance) {
            // Leave some for gas
            const maxAmount = parseFloat(ethBalance) - 0.001;
            if (maxAmount > 0) {
                setAmount(maxAmount.toFixed(6));
            }
        }
    }, [ethBalance]);

    const handleSend = useCallback(async () => {
        if (!canSend || !ethereumAddress) return;

        try {
            setSendState({ type: 'loading', message: 'Authenticating...' });

            const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });

            if (!walletKeys.ethKeyPair) {
                Alert.alert(t('common.error'), 'Ethereum wallet not available');
                setSendState({ type: 'idle' });
                return;
            }

            const { privateKey } = walletKeys.ethKeyPair;

            // Parse amount to wei
            const valueWei = parseEthToWei(amount);

            // Check balance
            setSendState({ type: 'loading', message: 'Checking balance...' });
            const balance = await getEthBalance(ethereumAddress, isTestnet);

            if (balance < valueWei) {
                Alert.alert(t('common.error'), 'Insufficient balance');
                setSendState({ type: 'idle' });
                return;
            }

            // Create and sign transaction
            setSendState({ type: 'loading', message: 'Creating transaction...' });
            const { signedTx, tx } = await createEthTransferTransaction(
                ethereumAddress,
                toAddress,
                valueWei,
                privateKey,
                isTestnet
            );

            // Send transaction
            setSendState({ type: 'loading', message: 'Sending transaction...' });
            const txHash = await sendRawTransaction(signedTx, isTestnet);

            setSendState({ type: 'loading', message: 'Waiting for confirmation...' });

            // Wait for confirmation
            const receipt = await waitForTransaction(txHash, isTestnet, 120000);
            const success = receipt.status === '0x1';

            if (success) {
                setSendState({ type: 'success', txHash });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Refresh balance
                const newBalance = await getEthBalance(ethereumAddress, isTestnet);
                setEthBalance(formatEthBalance(newBalance));

                Alert.alert(
                    'Transaction Successful',
                    `Sent ${amount} ETH to\n${toAddress.slice(0, 10)}...${toAddress.slice(-8)}\n\nTX: ${txHash.slice(0, 18)}...`,
                    [
                        {
                            text: 'Copy TX Hash',
                            onPress: () => {
                                Clipboard.setString(txHash);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        },
                        {
                            text: 'Done',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                setSendState({ type: 'error', message: 'Transaction failed' });
                Alert.alert('Transaction Failed', 'The transaction was not successful.');
            }

        } catch (e: any) {
            warn('Failed to send ETH transaction');
            setSendState({ type: 'error', message: e.message || 'Unknown error' });
            Alert.alert(t('common.error'), e.message || t('errors.unknown'));
        }
    }, [canSend, ethereumAddress, toAddress, amount, isTestnet, authContext, theme.surfaceOnBg]);

    const resetState = useCallback(() => {
        setSendState({ type: 'idle' });
    }, []);

    if (!hasEthereumWallet) {
        return (
            <View style={{ flexGrow: 1, paddingTop: 32 }}>
                <ScreenHeader
                    style={{ paddingHorizontal: 16 }}
                    onBackPressed={navigation.goBack}
                    title={'Send ETH'}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 17, textAlign: 'center' }}>
                        {'No Ethereum wallet found.\nImport a BIP39 compatible seed phrase to enable Ethereum.'}
                    </Text>
                </View>
            </View>
        );
    }

    const isLoading = sendState.type === 'loading';

    return (
        <View style={{ flexGrow: 1, paddingTop: 32 }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                title={'Send ETH'}
            />
            <KeyboardAvoidingView
                style={{ flex: 1, flexGrow: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{
                        flexGrow: 1,
                        flexBasis: 0,
                        paddingHorizontal: 16,
                        marginTop: 16
                    }}
                    contentInset={{
                        bottom: safeArea.bottom + 100,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Balance Card */}
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 24,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>
                                {'Available Balance'}
                            </Text>
                            <View style={{
                                backgroundColor: theme.accent,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                                    {isTestnet ? 'Sepolia' : 'Mainnet'}
                                </Text>
                            </View>
                        </View>
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 28,
                            fontWeight: '700',
                            marginTop: 8
                        }}>
                            {ethBalance !== null ? `${ethBalance} ETH` : '—'}
                        </Text>
                    </View>

                    {/* To Address Input */}
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>
                                {'Recipient Address'}
                            </Text>
                            <RoundButton
                                title={'Paste'}
                                display={'text'}
                                size={'small'}
                                onPress={handlePasteAddress}
                            />
                        </View>
                        <ATextInput
                            ref={addressInputRef}
                            value={toAddress}
                            onValueChange={setToAddress}
                            placeholder={'0x...'}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            keyboardType={'default'}
                            style={{ paddingVertical: 8 }}
                            inputStyle={{
                                fontSize: 16,
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            }}
                            error={toAddress.length > 0 && !isAddressValid ? 'Invalid Ethereum address' : undefined}
                        />
                    </View>

                    {/* Amount Input */}
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>
                                {'Amount (ETH)'}
                            </Text>
                            <RoundButton
                                title={'Max'}
                                display={'text'}
                                size={'small'}
                                onPress={handleMaxAmount}
                            />
                        </View>
                        <ATextInput
                            ref={amountInputRef}
                            value={amount}
                            onValueChange={setAmount}
                            placeholder={'0.0'}
                            keyboardType={'decimal-pad'}
                            style={{ paddingVertical: 8 }}
                            inputStyle={{ fontSize: 24, fontWeight: '600' }}
                            inputSuffix={' ETH'}
                        />
                    </View>

                    {/* Fee Estimate */}
                    {estimatedFee && (
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>
                                    {'Estimated Fee'}
                                </Text>
                                <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '500' }}>
                                    {`~${estimatedFee} ETH`}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 16,
                            padding: 20,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12
                        }}>
                            <ActivityIndicator size="small" color={theme.accent} />
                            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '500' }}>
                                {sendState.type === 'loading' ? sendState.message : ''}
                            </Text>
                        </View>
                    )}

                    {/* Error State */}
                    {sendState.type === 'error' && (
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: theme.accentRed,
                        }}>
                            <Text style={{ color: theme.accentRed, fontSize: 14, fontWeight: '500' }}>
                                {sendState.message}
                            </Text>
                            <RoundButton
                                title={'Try Again'}
                                display={'text'}
                                size={'small'}
                                style={{ marginTop: 8 }}
                                onPress={resetState}
                            />
                        </View>
                    )}
                </ScrollView>

                {/* Send Button */}
                <View style={{
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16,
                    backgroundColor: theme.backgroundPrimary
                }}>
                    <RoundButton
                        title={isLoading ? 'Sending...' : 'Sign & Send'}
                        disabled={!canSend || isLoading}
                        loading={isLoading}
                        onPress={handleSend}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
});

