import React, { createContext, memo, useCallback, useContext, useEffect, useState } from 'react';
import Animated, { BaseAnimationBuilder, EntryExitAnimationFunction, FadeOutUp, SlideInDown } from 'react-native-reanimated';
import { Alert, Platform, StyleProp, ViewStyle } from 'react-native';
import { SecureAuthenticationCancelledError, WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsState, BiometricsState, getPasscodeState, passcodeLengthKey, loadKeyStorageType } from '../../storage/secureStorage';
import { getAppState, getCurrentAddress } from '../../storage/appState';
import { warn } from '../../utils/log';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../storage/storage';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { PERMISSIONS, check, openSettings, request } from 'react-native-permissions';
import * as LocalAuthentication from 'expo-local-authentication'
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useBiometricsState, useSelectedAccount, useSetBiometricsState, useTheme } from '../../engine/hooks';
import { useLogoutAndReset } from '../../engine/hooks/accounts/useLogoutAndReset';
import { CloseButton } from '../navigation/CloseButton';

type EnteringAnimation = BaseAnimationBuilder
    | typeof BaseAnimationBuilder
    | EntryExitAnimationFunction

export type AuthParams = {
    backgroundColor?: string,
    paddingTop?: number,
    cancelable?: boolean,
    useBiometrics?: boolean,
    passcodeLength?: number,
    showResetOnMaxAttempts?: boolean,
    description?: string,
    enteringAnimation?: EnteringAnimation,
    containerStyle?: StyleProp<ViewStyle>,
}

export type AuthProps =
    | {
        returns: 'keysWithPasscode',
        promise: { resolve: (res: { keys: WalletKeys, passcode: string }) => void, reject: () => void }
        params?: AuthParams
    } |
    {
        returns: 'keysOnly',
        promise: { resolve: (keys: WalletKeys) => void, reject: () => void }
        params?: AuthParams
    }

export type AuthWalletKeysType = {
    authenticate: (style?: AuthParams) => Promise<WalletKeys>,
    authenticateWithPasscode: (style?: AuthParams) => Promise<{ keys: WalletKeys, passcode: string }>,
}

export async function checkBiometricsPermissions(passcodeState: PasscodeState | null): Promise<'use-passcode' | 'biometrics-setup-again' | 'biometrics-permission-check' | 'biometrics-cooldown' | 'biometrics-cancelled' | 'corrupted' | 'none'> {
    const storageType = loadKeyStorageType();

    if (storageType === 'local-authentication') {
        if (passcodeState === PasscodeState.Set) {
            return 'use-passcode';
        } else {
            return 'none';
        }
    }

    if (storageType === 'key-store') { // Android Only
        if (passcodeState === PasscodeState.Set) {
            return 'biometrics-setup-again'; // TODO: is it correct if we want to use old key-store?
        } else {
            return 'corrupted';
        }
    }

    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const faceIdSupported = supportedAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const touchIdSupported = supportedAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

    if (Platform.OS === 'ios') {
        const faceIdPemissionStatus = await check(PERMISSIONS.IOS.FACE_ID);

        if (!faceIdSupported && touchIdSupported) {
            return passcodeState === PasscodeState.Set ? 'biometrics-setup-again' : 'corrupted';
        }

        if (faceIdSupported) {
            if (faceIdPemissionStatus === 'granted') {
                return passcodeState === PasscodeState.Set ? 'biometrics-setup-again' : 'corrupted';
            } else if (faceIdPemissionStatus === 'blocked' || faceIdPemissionStatus === 'unavailable') {
                return 'biometrics-permission-check';
            } else if (faceIdPemissionStatus === 'limited') {
                return 'biometrics-cooldown';
            } else {
                const res = await request(PERMISSIONS.IOS.FACE_ID);
                if (res === 'granted') {
                    return 'biometrics-cancelled';
                } else {
                    return 'biometrics-permission-check';
                }
            }
        } else {
            return passcodeState === PasscodeState.Set ? 'use-passcode' : 'corrupted';
        }
    } else { // Android
        const level = await LocalAuthentication.getEnrolledLevelAsync();

        if ((faceIdSupported || touchIdSupported) && level === LocalAuthentication.SecurityLevel.BIOMETRIC) {
            return passcodeState === PasscodeState.Set ? 'biometrics-setup-again' : 'corrupted';
        } else {
            return passcodeState === PasscodeState.Set ? 'use-passcode' : 'corrupted';
        }
    }
}

export const AuthWalletKeysContext = createContext<AuthWalletKeysType | null>(null);

export const AuthWalletKeysContextProvider = memo((props: { children?: any }) => {
    const navigation = useTypedNavigation();
    const { showActionSheetWithOptions } = useActionSheet();
    const safeAreaInsets = useSafeAreaInsets();
    const theme = useTheme();
    const acc = useSelectedAccount();
    const logOutAndReset = useLogoutAndReset();
    const biometricsState = useBiometricsState();
    const setBiometricsState = useSetBiometricsState();

    const [auth, setAuth] = useState<AuthProps | null>(null);
    const [attempts, setAttempts] = useState(0);

    const authenticate = useCallback(async (style?: AuthParams) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        const passcodeState = getPasscodeState();
        const biometricsState = getBiometricsState();
        const useBiometrics = (biometricsState === BiometricsState.InUse || biometricsState === null);
        const passcodeLength = storage.getNumber(passcodeLengthKey) ?? 6;

        // Try to authenticate with biometrics
        // If biometrics are not available, shows proper alert to user or throws an error
        if (useBiometrics) {
            try {
                const acc = getCurrentAddress();
                const keys = await loadWalletKeys(acc.secretKeyEnc);
                if (biometricsState === null) {
                    setBiometricsState(BiometricsState.InUse);
                }
                return keys;
            } catch (e) {
                if (e instanceof SecureAuthenticationCancelledError) {
                    // If cancelled - do nothing
                } else {
                    // Check permissions
                    const premissionsRes = await checkBiometricsPermissions(passcodeState);

                    // Biometrics permission is not granted or blocked
                    if (premissionsRes === 'biometrics-permission-check') {
                        Alert.alert(
                            t('security.auth.biometricsPermissionCheck.title'),
                            t('security.auth.biometricsPermissionCheck.message'),
                            [
                                {
                                    text: passcodeState === PasscodeState.Set
                                        ? t('security.auth.biometricsPermissionCheck.authenticate')
                                        : t('common.cancel'),
                                },
                                {
                                    text: t('security.auth.biometricsPermissionCheck.openSettings'),
                                    onPress: openSettings
                                }
                            ]
                        );
                    }
                    //  Biometrics permission is granted but corrupted or not set up
                    else if (premissionsRes === 'biometrics-setup-again') {
                        // ask to setup again, but fallback to passcode and reset biometrics
                        setBiometricsState(BiometricsState.NotSet);
                        Alert.alert(
                            t('security.auth.biometricsSetupAgain.title'),
                            t('security.auth.biometricsSetupAgain.message'),
                            [
                                {
                                    text: t('security.auth.biometricsSetupAgain.authenticate'),
                                },
                            ]
                        );
                    }
                    // Too much attempts 
                    else if (premissionsRes === 'biometrics-cooldown') {
                        Alert.alert(
                            t('security.auth.biometricsCooldown.title'),
                            t('security.auth.biometricsCooldown.message'),
                            [{ text: t('common.ok') }]
                        );
                    }
                    // Biometrics permission is granted but corrupted or not set up and no passcode set
                    else if (premissionsRes === 'corrupted') {
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
                        throw Error('Failed to load keys, reason: storage corrupted');
                    }

                    // Overwise, premissionsRes: 'biometrics-cancelled' |'none' | 'use-passcode'
                    // -> Perform fallback to passcode
                }
            }
        }

        // Fallback to passcode if biometrics is not set or unavailable (checked before)
        if (passcodeState === PasscodeState.Set) {
            return new Promise<WalletKeys>((resolve, reject) => {
                setAuth({ returns: 'keysOnly', promise: { resolve, reject }, params: { showResetOnMaxAttempts: true, ...style, useBiometrics, passcodeLength } });
            });
        }

        throw Error('Failed to load keys');
    }, [auth, acc]);

    // Passcode only auth
    const authenticateWithPasscode = useCallback((style?: AuthParams) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        const passcodeLength = storage.getNumber(passcodeLengthKey) ?? 6;

        return new Promise<{ keys: WalletKeys, passcode: string }>((resolve, reject) => {
            const passcodeState = getPasscodeState();
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setAuth({ returns: 'keysWithPasscode', promise: { resolve, reject }, params: { showResetOnMaxAttempts: true, ...style, useBiometrics: false, passcodeLength } });
        });
    }, [auth]);

    const fullResetActionSheet = useCallback(() => {
        const options = [t('common.cancel'), t('deleteAccount.logOutAndDelete')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('confirm.logout.title'),
            message: t('confirm.logout.message'),
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    logOutAndReset(true);
                    navigation.navigateAndReplaceAll('Welcome');
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [logOutAndReset]);

    useEffect(() => {
        setAttempts(0);
    }, [auth]);

    return (
        <AuthWalletKeysContext.Provider value={{ authenticate, authenticateWithPasscode }}>
            {props.children}
            {auth !== null && (
                <Animated.View
                    style={[
                        {
                            position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                            backgroundColor: auth.params?.backgroundColor ?? theme.backgroundPrimary,
                            flexGrow: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: auth.params?.paddingTop ?? 0,
                            paddingBottom: safeAreaInsets.bottom === 0 ? 120 : safeAreaInsets.bottom,
                        },
                        auth.params?.containerStyle
                    ]}
                    exiting={FadeOutUp}
                    entering={auth.params?.enteringAnimation || SlideInDown}
                >
                    <PasscodeInput
                        style={{ marginTop: 49 }}
                        title={t('security.passcodeSettings.enterCurrent')}
                        description={auth.params?.description}
                        onEntered={async (pass) => {
                            if (!pass) {
                                auth.promise.reject();
                                setAuth(null);
                                return;
                            }

                            const acc = getCurrentAddress();
                            try {
                                const keys = await loadWalletKeys(acc.secretKeyEnc, pass);
                                if (auth.returns === 'keysWithPasscode') {
                                    auth.promise.resolve({ keys, passcode: pass });
                                } else {
                                    auth.promise.resolve(keys);
                                }
                            } catch {
                                setAttempts(attempts + 1);

                                // TODO: think about destroying keys after 30 attempts

                                throw Error('Failed to load keys');
                            }

                            // Remove auth view
                            setAuth(null);
                        }}
                        onLogoutAndReset={
                            (auth.params?.showResetOnMaxAttempts
                                && attempts > 5
                            )
                                ? fullResetActionSheet
                                : undefined
                        }
                        passcodeLength={auth.params?.passcodeLength}
                        onRetryBiometrics={
                            (auth.params?.useBiometrics && auth.returns === 'keysOnly' && biometricsState === BiometricsState.InUse)
                                ? async () => {
                                    try {
                                        const acc = getCurrentAddress();
                                        let keys = await loadWalletKeys(acc.secretKeyEnc);
                                        auth.promise.resolve(keys);
                                        // Remove auth view
                                        setAuth(null);
                                    } catch (e) {
                                        if (e instanceof SecureAuthenticationCancelledError) {
                                            return;
                                        } else {
                                            Alert.alert(t('secure.onBiometricsError'));
                                            warn('Failed to load wallet keys');
                                        }
                                    }
                                }
                                : undefined
                        }
                    />
                    {auth.params?.cancelable && (
                        <CloseButton
                            onPress={() => {
                                auth.promise.reject();
                                setAuth(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: Platform.OS === 'android'
                                    ? safeAreaInsets.top + 24 + (auth.params?.paddingTop ?? 0)
                                    : 24 + (auth.params?.paddingTop ?? 0),
                                right: 16,
                            }}
                        />
                    )}
                </Animated.View>
            )}
        </AuthWalletKeysContext.Provider>
    );
});
AuthWalletKeysContextProvider.displayName = 'AuthWalletKeysContextProvider';

export function useKeysAuth() {
    const context = useContext(AuthWalletKeysContext);
    if (!context) {
        throw new Error('useKeysAuth must be used within a AuthWalletKeysContextProvider');
    }
    return context;
}