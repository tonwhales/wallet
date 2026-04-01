import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RoundButton } from '../../components/RoundButton';
import { useNetwork, useSelectedAccount, useTheme, useWalletSettings } from '../../engine/hooks';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { encryptWalletData, validatePGPPublicKey } from '../../utils/pgp/pgpUtils';
import { hasPGPKeyPair, generateAndSavePGPKeyPair } from '../../utils/pgp/pgpStorage';
import { WalletExportData } from '../../utils/pgp/types';
import { Typography } from '../../components/styles';
import { Avatar, avatarColors } from '../../components/avatar/Avatar';
import { avatarHash } from '../../utils/avatarHash';

export const PGPExportFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const toaster = useToaster();
    const selectedAccount = useSelectedAccount();
    const [walletSettings] = useWalletSettings(selectedAccount?.address);

    const [publicKeyInput, setPublicKeyInput] = useState('');
    const [encryptedResult, setEncryptedResult] = useState<string | null>(null);
    const [isEncrypting, setIsEncrypting] = useState(false);

    // Screen capture protection
    useEffect(() => {
        const subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigateScreenCapture();
        });

        return () => {
            subscription?.remove();
        };
    }, []);

    const addressString = selectedAccount?.address.toString({ testOnly: isTestnet }) || '';
    const walletName = walletSettings?.name || t('common.wallet');
    const shortAddress = addressString ? addressString.slice(0, 4) + '...' + addressString.slice(-4) : '';

    const handleEncrypt = useCallback(async () => {
        if (!selectedAccount) {
            Alert.alert(t('common.error'), 'No wallet selected');
            return;
        }

        if (!publicKeyInput.trim()) {
            Alert.alert(t('common.error'), 'Please enter recipient\'s PGP public key');
            return;
        }

        // Validate PGP public key
        const isValidKey = await validatePGPPublicKey(publicKeyInput.trim());
        if (!isValidKey) {
            Alert.alert(t('common.error'), 'Invalid PGP public key format');
            return;
        }

        setIsEncrypting(true);

        try {
            // Authenticate to get passcode and keys
            const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });

            // Check if we need to create our own PGP keypair (for future imports)
            if (!hasPGPKeyPair()) {
                await generateAndSavePGPKeyPair(authResult.passcode);
            }

            const exportData: WalletExportData = {
                version: 1,
                wallets: [{
                    name: walletName,
                    address: addressString,
                    mnemonic: authResult.keys.mnemonics.join(' '),
                }],
            };

            // Encrypt with recipient's public key
            const encrypted = await encryptWalletData(exportData, publicKeyInput.trim());
            setEncryptedResult(encrypted);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: 'Encrypted successfully!',
                type: 'default',
                duration: ToastDuration.SHORT,
            });

        } catch {
            Alert.alert(t('common.error'), 'Failed to encrypt wallet');
        } finally {
            setIsEncrypting(false);
        }
    }, [selectedAccount, publicKeyInput, authContext, theme, walletName, addressString, toaster]);

    const copyEncrypted = useCallback(() => {
        if (encryptedResult) {
            Clipboard.setString(encryptedResult);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: t('common.copied'),
                type: 'default',
                duration: ToastDuration.SHORT,
            });
        }
    }, [encryptedResult, toaster]);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary,
            paddingTop: safeArea.top,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ScreenHeader
                title="PGP Export"
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                contentContainerStyle={{
                    paddingBottom: safeArea.bottom + 100,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Description */}
                <Text style={[Typography.regular15_20, {
                    color: theme.textSecondary,
                    marginTop: 16,
                    marginBottom: 24,
                }]}>
                    Encrypt your current wallet seed phrase with PGP. Enter recipient's public key to create an encrypted backup.
                </Text>

                {/* Current Wallet Info */}
                <Text style={[Typography.semiBold17_24, {
                    color: theme.textPrimary,
                    marginBottom: 12,
                }]}>
                    Wallet to export
                </Text>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 14,
                }}>
                    <Avatar
                        size={46}
                        id={addressString}
                        hash={walletSettings?.avatar}
                        theme={theme}
                        hashColor
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[Typography.semiBold17_24, { color: theme.textPrimary }]}>
                            {walletName}
                        </Text>
                        <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                            {shortAddress}
                        </Text>
                    </View>
                </View>

                {/* Public Key Input */}
                <Text style={[Typography.semiBold17_24, {
                    color: theme.textPrimary,
                    marginTop: 24,
                    marginBottom: 12,
                }]}>
                    Recipient's PGP Public Key
                </Text>

                <TextInput
                    style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 14,
                        padding: 16,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        minHeight: 150,
                        textAlignVertical: 'top',
                    }}
                    placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;...&#10;-----END PGP PUBLIC KEY BLOCK-----"
                    placeholderTextColor={theme.textSecondary}
                    value={publicKeyInput}
                    onChangeText={setPublicKeyInput}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {/* Encrypt Button */}
                <RoundButton
                    title={isEncrypting ? 'Encrypting...' : '🔐 Encrypt'}
                    style={{ marginTop: 24 }}
                    onPress={handleEncrypt}
                    disabled={isEncrypting || !publicKeyInput.trim()}
                    loading={isEncrypting}
                />

                {/* Encrypted Result */}
                {encryptedResult && (
                    <View style={{ marginTop: 32 }}>
                        <Text style={[Typography.semiBold17_24, {
                            color: theme.textPrimary,
                            marginBottom: 12,
                        }]}>
                            Encrypted Message
                        </Text>

                        <Text style={[Typography.regular13_18, {
                            color: theme.textSecondary,
                            marginBottom: 8,
                        }]}>
                            Tap to copy. Send this encrypted message to the recipient.
                        </Text>

                        <TextInput
                            style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 14,
                                padding: 16,
                                color: theme.accent,
                                fontSize: 12,
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                minHeight: 200,
                                textAlignVertical: 'top',
                            }}
                            value={encryptedResult}
                            multiline
                            editable={false}
                            onPressIn={copyEncrypted}
                        />

                        <RoundButton
                            display="secondary"
                            title="📋 Copy to Clipboard"
                            style={{ marginTop: 16 }}
                            onPress={copyEncrypted}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
});
