import * as React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { getAppState, getBackup, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { PasscodeSetup } from '../passcode/PasscodeSetup';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { WalletSecureComponent } from './WalletSecureComponent';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import { LoadingIndicator } from '../LoadingIndicator';
import { storage } from '../../storage/storage';
import { BiometricsState, PasscodeState, encryptData, generateNewKeyAndEncryptWithPasscode, getBiometricsState, getPasscodeState, passcodeStateKey } from '../../storage/secureStorage';
import { useCallback, useEffect, useState } from 'react';
import { checkBiometricsPermissions, useKeysAuth } from './AuthWalletKeys';
import { mnemonicToWalletKey } from '@ton/crypto';
import { useNetwork, useBounceableWalletFormat, useSetAppState, useSetPasscodeState, useTheme } from '../../engine/hooks';
import { useLogoutAndReset } from '../../engine/hooks/accounts/useLogoutAndReset';
import { openSettings } from 'react-native-permissions';
import { ScreenHeader } from '../ScreenHeader';
import { WalletVersions } from '../../engine/types';

export const WalletSecurePasscodeComponent = systemFragment((props: {
    mnemonics: string,
    import: boolean,
    onBack?: () => void,
    additionalWallet?: boolean,
    versions?: WalletVersions[];
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const setAppState = useSetAppState();
    const logOutAndReset = useLogoutAndReset();
    const setPascodeState = useSetPasscodeState();
    const [, setBounceable] = useBounceableWalletFormat();
    const [versions] = useState(props.versions ?? [WalletVersions.v5R1]);

    const [state, setState] = useState<{ passcode: string, deviceEncryption: DeviceEncryption }>();
    const [loading, setLoading] = useState(false);

    const onComplete = useCallback(() => {
        const address = getBackup();
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address);
        navigation.navigateAndReplaceAll('Home');
    }, []);

    // Create new wallet on launch if no wallets exist
    useEffect(() => {
        const appState = getAppState();
        if (appState.addresses.length <= 0) {
            return;
        }
        (async () => {
            setLoading(true);
            try {
                // Encrypted token
                let secretKeyEnc: Buffer | undefined = undefined;

                // Authenticate
                const passcodeState = getPasscodeState();
                const biometricsState = getBiometricsState();
                const useBiometrics = (biometricsState === BiometricsState.InUse);

                const tryPasscode = async () => {
                    const authRes = await authContext.authenticateWithPasscode();
                    if (authRes) {
                        secretKeyEnc = await encryptData(Buffer.from(props.mnemonics), authRes.passcode);
                    }
                }

                if (useBiometrics) {
                    try {
                        secretKeyEnc = await encryptData(Buffer.from(props.mnemonics));
                    } catch {
                        const premissionsRes = await checkBiometricsPermissions(passcodeState);
                        if (premissionsRes === 'biometrics-permission-check') {
                            const resolved = await new Promise<boolean>(resolve => {
                                Alert.alert(
                                    t('security.auth.biometricsPermissionCheck.title'),
                                    t('security.auth.biometricsPermissionCheck.message'),
                                    [
                                        {
                                            text: passcodeState === PasscodeState.Set
                                                ? t('security.auth.biometricsPermissionCheck.authenticate')
                                                : t('common.cancel'),
                                            onPress: async () => {
                                                await tryPasscode();
                                                props.onBack?.();
                                                resolve(false);
                                            }
                                        },
                                        {
                                            text: t('security.auth.biometricsPermissionCheck.openSettings'),
                                            onPress: () => {
                                                props.onBack?.();
                                                openSettings();
                                                resolve(true);
                                            }
                                        }
                                    ]
                                );
                            });
                            if (resolved) {
                                return;
                            }
                        } else if (premissionsRes === 'biometrics-setup-again') {
                            const authWithPasscode = await new Promise<boolean>(resolve => {
                                Alert.alert(
                                    t('security.auth.biometricsSetupAgain.title'),
                                    t('security.auth.biometricsSetupAgain.message'),
                                    [
                                        {
                                            text: t('security.auth.biometricsSetupAgain.authenticate'),
                                            onPress: async () => {
                                                await tryPasscode();
                                                props.onBack?.();
                                                resolve(false);
                                            }
                                        },
                                        {
                                            text: t('security.auth.biometricsSetupAgain.setup'),
                                            onPress: () => {
                                                navigation.navigate('BiometricsSetup');
                                                resolve(true);
                                            }
                                        }
                                    ]
                                );
                            });

                            if (authWithPasscode) {
                                return;
                            }
                        } else if (premissionsRes === 'biometrics-cooldown') {
                            await new Promise<void>(resolve => {
                                Alert.alert(
                                    t('security.auth.biometricsCooldown.title'),
                                    t('security.auth.biometricsCooldown.message'),
                                    [
                                        {
                                            text: t('common.ok'),
                                            onPress: () => {
                                                props.onBack?.();
                                                resolve();
                                            }
                                        },
                                    ]
                                );
                            });
                            return;
                        } else if (premissionsRes === 'corrupted') {
                            const appState = getAppState();
                            await new Promise<void>(resolve => {
                                Alert.alert(
                                    t('security.auth.biometricsCorrupted.title'),
                                    appState.addresses.length > 1
                                        ? t('security.auth.biometricsCorrupted.messageLogout')
                                        : t('security.auth.biometricsCorrupted.message'),
                                    [
                                        {
                                            text: appState.addresses.length > 1
                                                ? t('security.auth.biometricsCorrupted.logout')
                                                : t('security.auth.biometricsCorrupted.restore'),
                                            onPress: () => {
                                                resolve();
                                                logOutAndReset(true);
                                                navigation.navigateAndReplaceAll('Welcome');
                                            },
                                            style: 'destructive'
                                        },
                                    ]
                                );
                            });
                            return;
                        }
                    }
                } else if (passcodeState === PasscodeState.Set) {
                    await tryPasscode();
                }

                if (!secretKeyEnc) {
                    throw new Error('Invalid app key');
                }

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve utility key
                const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

                versions.forEach(async (version) => {
                    // Resolve contract
                    const contract = await contractFromPublicKey(key.publicKey, version);

                    // Persist state
                    const state = getAppState();
                    setAppState({
                        addresses: [
                            ...state.addresses,
                            {
                                address: contract.address,
                                publicKey: key.publicKey,
                                secretKeyEnc: secretKeyEnc as Buffer, // With passcode
                                utilityKey,
                                addressString: contract.address.toString({ testOnly: isTestnet }),
                                version
                            }
                        ],
                        selected: state.addresses.length
                    }, isTestnet);

                    console.log('Marking address as secured', contract.address.toString({ testOnly: isTestnet }));
                    markAddressSecured(contract.address);
                });

                onComplete();
            } catch {
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onConfirmed = useCallback(async (passcode: string) => {
        setLoading(true);
        try {

            // Encrypted token
            let secretKeyEnc: Buffer;

            // Resolve key
            const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

            // Resolve utility key
            const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

            const passcodeState = storage.getString(passcodeStateKey);
            const isPasscodeSet = (passcodeState === PasscodeState.Set);

            const appState = getAppState();

            if (isPasscodeSet && appState.addresses.length > 0) {
                // Use prev app key
                try {
                    secretKeyEnc = await encryptData(Buffer.from(props.mnemonics), passcode);
                } catch {
                    warn('Failed to encrypt with passcode');
                    return;
                }
            } else {
                // Generate New Key
                try {
                    secretKeyEnc = await generateNewKeyAndEncryptWithPasscode(
                        Buffer.from(props.mnemonics),
                        passcode,
                        setPascodeState
                    );
                } catch {
                    // Ignore
                    warn('Failed to generate new key');
                    return;
                }
            }

            versions.forEach(async (version) => {
                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey, version);

                // Set new format for new wallets
                setBounceable(false);

                const appState = getAppState();
                // Persist state
                setAppState({
                    addresses: [
                        ...appState.addresses,
                        {
                            address: contract.address,
                            publicKey: key.publicKey,
                            secretKeyEnc, // With passcode
                            utilityKey,
                            addressString: contract.address.toString({ testOnly: isTestnet }),
                            version
                        }
                    ],
                    selected: appState.addresses.length
                }, isTestnet);

                const account = getCurrentAddress();
                markAddressSecured(account.address);
            });

            const deviceEncryption = await getDeviceEncryption();

            let disableEncryption =
                (deviceEncryption === 'none')
                || (deviceEncryption === 'device-biometrics')
                || (deviceEncryption === 'device-passcode')
                || (Platform.OS === 'android' && Platform.Version < 30);
            

            // Skip biometrics setup if encryption is disabled
            if (disableEncryption) {
                if (props.import) {
                    let state = getAppState();
                    if (!state) {
                        throw Error('Invalid state');
                    }
                }
                navigation.navigateAndReplaceAll('Home');
                return;
            }

            setState({ passcode, deviceEncryption });
        } catch {
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
        } finally {
            setLoading(false);
        }
    }, [setAppState, setBounceable, versions]);

    const resetConfirmedAddressState = useCallback(() => {
        if (!state) {
            return;
        }

        try {
            const appState = getAppState();
            const account = getCurrentAddress();

            const newAddresses = appState.addresses.filter((a) => !a.address.equals(account.address));

            if (newAddresses.length > 0) {
                setAppState({
                    addresses: newAddresses,
                    selected: newAddresses.length - 1,
                }, isTestnet);
            } else {
                setAppState({ addresses: [], selected: -1 }, isTestnet);
            }
        } catch {
            // Ignore
        }

    }, [state, setAppState]);

    return (
        <View style={{ flexGrow: 1, width: '100%', paddingTop: 32 }}>
            {(loading || props.additionalWallet) ? (
                <Animated.View
                    style={{ flex: 1, flexDirection: 'row' }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    <LoadingIndicator style={StyleSheet.absoluteFill} simple />
                    <ScreenHeader
                        style={{ paddingHorizontal: 16 }}
                        onBackPressed={props.onBack}
                    />
                </Animated.View>
            ) : (
                !state ? (
                    <Animated.View
                        style={[
                            { flex: 1 },
                            Platform.select({ android: { paddingTop: 0, paddingBottom: 16 }, ios: { paddingBottom: undefined } })
                        ]}
                    >
                        <PasscodeSetup
                            style={props.import ? { backgroundColor: theme.backgroundPrimary } : undefined}
                            onReady={onConfirmed}
                            onBack={() => {
                                if (props.onBack) {
                                    resetConfirmedAddressState();
                                    props.onBack();
                                } else {
                                    navigation.goBack();
                                }
                            }}
                            description={t('secure.passcodeSetupDescription')}
                            screenHeaderStyle={props.import ? { paddingHorizontal: 16 } : undefined}
                        />
                    </Animated.View>
                ) : (
                    <Animated.View
                        style={{ justifyContent: 'center', flexGrow: 1 }}
                        key={'content'}
                        entering={FadeIn}
                    >
                        <WalletSecureComponent
                            deviceEncryption={state.deviceEncryption}
                            passcode={state.passcode}
                            import={props.import}
                            callback={(res: boolean) => {
                                if (res) {
                                    onComplete();
                                } else {
                                    resetConfirmedAddressState();
                                    setState(undefined);
                                }
                            }}
                            onLater={onComplete}
                        />
                    </Animated.View>
                )
            )}
        </View>
    );
});