import * as React from 'react';
import { Platform, View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { RoundButton } from '../../components/RoundButton';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { warn } from '../../utils/log';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import * as ScreenCapture from 'expo-screen-capture';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MnemonicsView } from '../../components/secure/MnemonicsView';
import { useNetwork, useSetAppState, useTheme, useBounceableWalletFormat } from '../../engine/hooks';
import { StatusBar } from 'expo-status-bar';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { generateUniversalMnemonic } from '../../utils/bip39';
import { mnemonicToWalletKey } from '@ton/crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { ethereumPrivateKeyFromMnemonic } from '../../utils/ethereum/address';
import { getAppState, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { BiometricsState, encryptData, getBiometricsState, getPasscodeState, PasscodeState } from '../../storage/secureStorage';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { WalletVersions } from '../../engine/types';

type State = {
    mnemonic: string;
    attempts: number;
};

export const UniversalWalletCreateFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const toaster = useToaster();
    const setAppState = useSetAppState();
    const [, setBounceable] = useBounceableWalletFormat();
    const authContext = useKeysAuth();

    const [state, setState] = useState<State | null>(null);
    const [loading, setLoading] = useState(false);

    // Generate universal mnemonic on mount
    useEffect(() => {
        (async () => {
            const result = await generateUniversalMnemonic(24);

            if (!result.isTonValid) {
                Alert.alert(
                    'Warning',
                    `Could not find TON-compatible mnemonic after ${result.attempts} attempts. Please try again.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return;
            }

            setState({
                mnemonic: result.mnemonic.join(' '),
                attempts: result.attempts
            });
        })();
    }, []);

    // Screenshot protection
    useLayoutEffect(() => {
        let subscription: ScreenCapture.Subscription;
        if (state) {
            subscription = ScreenCapture.addScreenshotListener(() => {
                navigation.navigateScreenCapture();
            });
        }

        return () => {
            subscription?.remove();
        };
    }, [navigation, state]);

    const createWallets = useCallback(async () => {
        if (!state) return;

        setLoading(true);
        try {
            const mnemonics = state.mnemonic.split(' ');

            // Check authentication method
            const passcodeState = getPasscodeState();
            const biometricsState = getBiometricsState();
            const useBiometrics = biometricsState === BiometricsState.InUse;

            let secretKeyEnc: Buffer;
            let ethereumSecretKeyEnc: Buffer;

            // Resolve TON wallet key
            const key = await mnemonicToWalletKey(mnemonics);

            // Resolve utility key
            const utilityKey = await deriveUtilityKey(mnemonics);

            // Resolve Ethereum private key
            const ethereumPrivateKey = await ethereumPrivateKeyFromMnemonic(mnemonics);

            // Encrypt keys based on auth method
            if (useBiometrics) {
                secretKeyEnc = await encryptData(Buffer.from(state.mnemonic));
                ethereumSecretKeyEnc = await encryptData(Buffer.from(ethereumPrivateKey));
            } else if (passcodeState === PasscodeState.Set) {
                const authResult = await authContext.authenticateWithPasscode({ backgroundColor: theme.surfaceOnBg });
                secretKeyEnc = await encryptData(Buffer.from(state.mnemonic), authResult.passcode);
                ethereumSecretKeyEnc = await encryptData(Buffer.from(ethereumPrivateKey), authResult.passcode);
            } else {
                throw new Error('No authentication method available');
            }

            // Resolve TON contract
            const contract = await contractFromPublicKey(key.publicKey, WalletVersions.v5R1, isTestnet);

            // Set new format for new wallets
            setBounceable(false);

            // Save to app state
            const currentAppState = getAppState();
            setAppState({
                addresses: [
                    ...currentAppState.addresses,
                    {
                        address: contract.address,
                        publicKey: key.publicKey,
                        secretKeyEnc,
                        utilityKey,
                        addressString: contract.address.toString({ testOnly: isTestnet }),
                        version: WalletVersions.v5R1,
                        ethereumSecretKeyEnc
                    }
                ],
                selected: currentAppState.addresses.length
            }, isTestnet);

            // Mark as secured
            const account = getCurrentAddress();
            markAddressSecured(account.address);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Navigate to home
            navigation.navigateAndReplaceAll('Home');

        } catch (e) {
            warn('Failed to create universal wallet');
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
        } finally {
            setLoading(false);
        }
    }, [state, isTestnet, setAppState, setBounceable, authContext, theme.surfaceOnBg]);

    const onBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <View
            style={[
                Platform.select({ android: { paddingBottom: safeArea.bottom + 16 } }),
                { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center' }
            ]}
        >
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />

            {/* Loading state */}
            {(!state || loading) && (
                <Animated.View
                    style={{
                        flexGrow: 1,
                        backgroundColor: theme.backgroundPrimary,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                        width: '100%',
                    }}
                    key={'loading'}
                    exiting={FadeOutDown}
                >
                    <ScreenHeader
                        onBackPressed={loading ? undefined : onBack}
                        style={{ paddingHorizontal: 16 }}
                    />
                    <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                        <LoadingIndicator
                            simple
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </Animated.View>
            )}

            {/* Mnemonic display */}
            {state && !loading && (
                <View style={{ flexGrow: 1, width: '100%' }}>
                    <ScreenHeader
                        onBackPressed={onBack}
                        style={[{ paddingTop: safeArea.top }, Platform.select({ ios: { paddingTop: 32 } })]}
                    />
                    <ScrollView
                        alwaysBounceVertical={false}
                        style={{ width: '100%', paddingHorizontal: 16, flexShrink: 1 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: theme.textPrimary,
                            marginBottom: 12
                        }}>
                            {'Universal Wallet'}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: theme.textSecondary,
                            marginBottom: 8
                        }}>
                            {'This seed phrase is compatible with both TON and Ethereum (BIP39). Save it securely!'}
                        </Text>

                        {/* Compatibility badges */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                            <View style={{
                                backgroundColor: theme.accent,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                                    {'TON ✓'}
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: theme.accent,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                                    {'Ethereum ✓'}
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>
                                    {`${state.attempts} attempts`}
                                </Text>
                            </View>
                        </View>

                        <MnemonicsView
                            mnemonics={state.mnemonic}
                            preventCapture={true}
                        />

                        {(isTestnet || __DEV__) && (
                            <RoundButton
                                display={'text'}
                                title={t('create.copy')}
                                style={{ marginTop: 20 }}
                                onPress={() => {
                                    try {
                                        Clipboard.setString(state.mnemonic);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        toaster.show({
                                            message: t('common.copied'),
                                            type: 'default',
                                            duration: ToastDuration.SHORT,
                                            marginBottom: Platform.select({ android: safeArea.bottom + 16 })
                                        });
                                    } catch {
                                        warn('Failed to copy words');
                                        Alert.alert(t('common.error'), t('errors.unknown'));
                                    }
                                }}
                            />
                        )}
                    </ScrollView>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                        <RoundButton
                            title={t('create.okSaved')}
                            onPress={createWallets}
                        />
                    </View>
                </View>
            )}
        </View>
    );
});
