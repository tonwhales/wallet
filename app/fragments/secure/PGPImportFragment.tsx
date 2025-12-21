import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { mnemonicValidate } from '@ton/crypto';

import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RoundButton } from '../../components/RoundButton';
import { useNetwork, useTheme, useSetAppState } from '../../engine/hooks';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { decryptWalletData, validatePGPMessage } from '../../utils/pgp/pgpUtils';
import { hasPGPKeyPair, loadPGPKeyPair, generateAndSavePGPKeyPair } from '../../utils/pgp/pgpStorage';
import { PGPKeyPair, WalletExportData } from '../../utils/pgp/types';
import { Typography } from '../../components/styles';
import { getAppState } from '../../storage/appState';
import { createWalletFromMnemonics } from '../../utils/createWalletFromMnemonics';
import { setWalletsSettings, getWalletsSettings } from '../../engine/state/walletSettings';
import { WalletVersions } from '../../engine/types';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';

export const PGPImportFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const setAppState = useSetAppState();
    const authContext = useKeysAuth();

    const [keyPair, setKeyPair] = useState<PGPKeyPair | null>(null);
    const [hasKeyPair, setHasKeyPair] = useState<boolean | null>(null); // null = checking
    const [isLoading, setIsLoading] = useState(false);
    const [encryptedInput, setEncryptedInput] = useState('');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importedWalletName, setImportedWalletName] = useState<string | null>(null);

    // Check if keypair exists on mount
    useEffect(() => {
        setHasKeyPair(hasPGPKeyPair());
    }, []);

    // Screen capture protection
    useEffect(() => {
        const subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigateScreenCapture();
        });

        return () => {
            subscription?.remove();
        };
    }, []);

    // Load existing keypair
    const loadKeyPair = useCallback(async () => {
        setIsLoading(true);
        try {
            // Authenticate to get passcode if needed
            const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });
            const loaded = await loadPGPKeyPair(authResult.passcode);
            if (loaded) {
                setKeyPair(loaded);
            } else {
                Alert.alert(t('common.error'), 'Failed to load PGP keypair');
            }
        } catch (e) {
            warn('Failed to load PGP keypair: ' + String(e));
        } finally {
            setIsLoading(false);
        }
    }, [authContext, theme]);

    // Generate new keypair
    const generateKeyPair = useCallback(async () => {
        setIsLoading(true);
        try {
            // Authenticate to get passcode if needed
            const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });
            const newKeyPair = await generateAndSavePGPKeyPair(authResult.passcode);
            setKeyPair(newKeyPair);
            setHasKeyPair(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: 'PGP keypair created!',
                type: 'default',
                duration: ToastDuration.SHORT,
            });
        } catch (e) {
            warn('Failed to generate PGP keypair: ' + String(e));
            Alert.alert(t('common.error'), 'Failed to generate PGP keypair');
        } finally {
            setIsLoading(false);
        }
    }, [authContext, theme, toaster]);

    const copyPublicKey = useCallback(() => {
        if (keyPair?.publicKey) {
            Clipboard.setString(keyPair.publicKey);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: t('common.copied'),
                type: 'default',
                duration: ToastDuration.SHORT,
            });
        }
    }, [keyPair, toaster]);

    const handleImport = useCallback(async () => {
        if (!encryptedInput.trim()) {
            Alert.alert(t('common.error'), 'Please paste the encrypted message');
            return;
        }

        if (!keyPair?.privateKey) {
            Alert.alert(t('common.error'), 'No keypair available. Please load or create one.');
            return;
        }

        // Validate PGP message format
        const isValidMessage = await validatePGPMessage(encryptedInput.trim());
        if (!isValidMessage) {
            Alert.alert(t('common.error'), 'Invalid PGP encrypted message format');
            return;
        }

        setIsDecrypting(true);

        try {
            // Decrypt the message
            const decryptedData: WalletExportData = await decryptWalletData(
                encryptedInput.trim(),
                keyPair.privateKey,
                keyPair.passphrase
            );

            // Validate decrypted data
            if (!decryptedData.wallets || decryptedData.wallets.length === 0) {
                Alert.alert(t('common.error'), 'No wallet found in decrypted data');
                setIsDecrypting(false);
                return;
            }

            // Import only the first wallet
            const wallet = decryptedData.wallets[0];

            // Parse mnemonics
            const mnemonics = wallet.mnemonic.split(' ').map(w => w.trim().toLowerCase());

            // Validate mnemonics
            const isValid = await mnemonicValidate(mnemonics);
            if (!isValid) {
                warn(`Invalid mnemonic for wallet: ${wallet.name}`);
                Alert.alert(t('common.error'), 'Invalid seed phrase in the encrypted data');
                setIsDecrypting(false);
                return;
            }

            // Create wallets from mnemonics (both v5R1 and v4R2)
            const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });
            const walletV5 = await createWalletFromMnemonics(mnemonics, isTestnet, WalletVersions.v5R1, authResult.passcode);
            const walletV4 = await createWalletFromMnemonics(mnemonics, isTestnet, WalletVersions.v4R2, authResult.passcode);

            // Check which wallets already exist
            const currentAppState = getAppState();
            const v5Exists = currentAppState.addresses.some(a => a.address.equals(walletV5.address));
            const v4Exists = currentAppState.addresses.some(a => a.address.equals(walletV4.address));

            if (v5Exists && v4Exists) {
                Alert.alert(t('common.error'), 'Both wallet versions already exist');
                setIsDecrypting(false);
                return;
            }

            // Collect wallets to add
            const walletsToAdd: typeof walletV5[] = [];
            if (!v5Exists) walletsToAdd.push(walletV5);
            if (!v4Exists) walletsToAdd.push(walletV4);

            // Add new wallets
            const newAddresses = [...currentAppState.addresses, ...walletsToAdd];
            const newState = {
                ...currentAppState,
                addresses: newAddresses,
                selected: newAddresses.length - 1, // Select last imported wallet
            };

            setAppState(newState, isTestnet);

            // Save wallet names for each added wallet
            const currentSettings = getWalletsSettings();
            const newSettings = { ...currentSettings };

            for (const addedWallet of walletsToAdd) {
                const addressString = addedWallet.address.toString({ testOnly: isTestnet });
                const versionSuffix = addedWallet.version === WalletVersions.v5R1 ? ' (v5)' : ' (v4)';
                newSettings[addressString] = {
                    name: wallet.name + versionSuffix,
                    avatar: null,
                    color: null,
                };
            }

            setWalletsSettings(newSettings);

            const addedVersions = walletsToAdd.map(w => w.version === WalletVersions.v5R1 ? 'v5R1' : 'v4R2').join(', ');
            setImportedWalletName(`${wallet.name} (${addedVersions})`);
            setImportSuccess(true);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: `Wallet "${wallet.name}" imported!`,
                type: 'default',
                duration: ToastDuration.LONG,
            });

        } catch (e) {
            console.error('Failed to decrypt/import wallet', e);
            Alert.alert(
                t('common.error'),
                'Failed to decrypt message. Make sure the message was encrypted with your public key.'
            );
        } finally {
            setIsDecrypting(false);
        }
    }, [encryptedInput, keyPair, isTestnet, setAppState, toaster]);

    const handleDone = useCallback(() => {
        navigation.navigateAndReplaceAll('Home');
    }, [navigation]);

    // Still checking if keypair exists
    if (hasKeyPair === null) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.backgroundPrimary,
                paddingTop: safeArea.top,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <ActivityIndicator color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary,
            paddingTop: safeArea.top,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ScreenHeader
                title="PGP Import"
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
                    Import a wallet from a PGP encrypted backup. Share your public key with the sender, then paste the encrypted message below.
                </Text>

                {/* Public Key Section */}
                <Text style={[Typography.semiBold17_24, {
                    color: theme.textPrimary,
                    marginBottom: 12,
                }]}>
                    Your Public Key
                </Text>

                {!hasKeyPair ? (
                    // No keypair exists - offer to create
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 14,
                        padding: 24,
                        alignItems: 'center',
                    }}>
                        <Text style={[Typography.regular15_20, {
                            color: theme.textSecondary,
                            textAlign: 'center',
                            marginBottom: 16,
                        }]}>
                            You don't have a PGP keypair yet. Create one to receive encrypted wallet backups.
                        </Text>
                        <RoundButton
                            title={isLoading ? 'Creating...' : '🔐 Create PGP Keypair'}
                            onPress={generateKeyPair}
                            disabled={isLoading}
                            loading={isLoading}
                        />
                    </View>
                ) : !keyPair ? (
                    // Keypair exists but not loaded
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 14,
                        padding: 24,
                        alignItems: 'center',
                    }}>
                        <Text style={[Typography.regular15_20, {
                            color: theme.textSecondary,
                            textAlign: 'center',
                            marginBottom: 16,
                        }]}>
                            Your PGP keypair is stored securely. Unlock to view your public key.
                        </Text>
                        <RoundButton
                            title={isLoading ? 'Loading...' : '🔓 Unlock PGP Keypair'}
                            onPress={loadKeyPair}
                            disabled={isLoading}
                            loading={isLoading}
                        />
                    </View>
                ) : (
                    // Keypair loaded - show public key
                    <>
                        <Text style={[Typography.regular13_18, {
                            color: theme.textSecondary,
                            marginBottom: 8,
                        }]}>
                            Share this with the sender so they can encrypt the backup for you.
                        </Text>

                        <TextInput
                            style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 14,
                                padding: 16,
                                color: theme.accent,
                                fontSize: 11,
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                minHeight: 150,
                                textAlignVertical: 'top',
                            }}
                            value={keyPair.publicKey}
                            multiline
                            editable={false}
                            onPressIn={copyPublicKey}
                        />

                        <RoundButton
                            display="secondary"
                            title="📋 Copy Public Key"
                            style={{ marginTop: 12 }}
                            onPress={copyPublicKey}
                        />
                    </>
                )}

                {/* Encrypted Message Input - only show if keypair is loaded */}
                {keyPair && (
                    <>
                        <Text style={[Typography.semiBold17_24, {
                            color: theme.textPrimary,
                            marginTop: 32,
                            marginBottom: 12,
                        }]}>
                            Encrypted Message
                        </Text>

                        <Text style={[Typography.regular13_18, {
                            color: theme.textSecondary,
                            marginBottom: 8,
                        }]}>
                            Paste the encrypted message you received.
                        </Text>

                        <TextInput
                            style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 14,
                                padding: 16,
                                color: theme.textPrimary,
                                fontSize: 12,
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                minHeight: 180,
                                textAlignVertical: 'top',
                            }}
                            placeholder="-----BEGIN PGP MESSAGE-----&#10;...&#10;-----END PGP MESSAGE-----"
                            placeholderTextColor={theme.textSecondary}
                            value={encryptedInput}
                            onChangeText={setEncryptedInput}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {/* Import Button */}
                        <RoundButton
                            title={isDecrypting ? 'Importing...' : '📥 Import Wallet'}
                            style={{ marginTop: 24 }}
                            onPress={handleImport}
                            disabled={isDecrypting || !encryptedInput.trim() || importSuccess}
                            loading={isDecrypting}
                        />

                        {/* Import Result */}
                        {importSuccess && (
                            <View style={{
                                marginTop: 32,
                                padding: 20,
                                backgroundColor: theme.accentGreen + '20',
                                borderRadius: 14,
                            }}>
                                <Text style={[Typography.semiBold17_24, {
                                    color: theme.textPrimary,
                                    marginBottom: 8,
                                    textAlign: 'center',
                                }]}>
                                    ✅ Import Complete
                                </Text>

                                <Text style={[Typography.regular15_20, {
                                    color: theme.textPrimary,
                                    textAlign: 'center',
                                }]}>
                                    Wallet "{importedWalletName}" imported successfully
                                </Text>

                                <RoundButton
                                    title="Done"
                                    style={{ marginTop: 16 }}
                                    onPress={handleDone}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
});
