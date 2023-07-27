import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Alert, Platform, Pressable, Text } from 'react-native';
import { WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsState, BiometricsState, getPasscodeState, passcodeLengthKey } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { getCurrentAddress } from '../../storage/appState';
import { warn } from '../../utils/log';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../storage/storage';

export type AuthParams = {
    backgroundColor?: string,
    cancelable?: boolean,
    useBiometrics?: boolean,
    passcodeLength?: number,
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

export const AuthWalletKeysContext = React.createContext<AuthWalletKeysType | null>(null);

export const AuthWalletKeysContextProvider = React.memo((props: { children?: any }) => {
    const safeAreaInsets = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const [auth, setAuth] = useState<AuthProps | null>(null);

    const authenticate = useCallback(async (style?: AuthParams) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        const acc = getCurrentAddress();
        const passcodeState = getPasscodeState();
        const biometricsState = getBiometricsState();
        const useBiometrics = (biometricsState === BiometricsState.InUse);
        const passcodeLength = storage.getNumber(passcodeLengthKey) ?? 6;

        if (useBiometrics) {
            try {
                const keys = await loadWalletKeys(acc.secretKeyEnc);
                return keys;
            } catch (e) {
                warn('Failed to load wallet keys with biometrics');

                // Retry with passcode
                if (passcodeState === PasscodeState.Set) {
                    return new Promise<WalletKeys>((resolve, reject) => {
                        setAuth({ returns: 'keysOnly', promise: { resolve, reject }, params: { useBiometrics: true, ...style, passcodeLength } });
                    });
                }
            }
        }

        if (passcodeState === PasscodeState.Set) {
            return new Promise<WalletKeys>((resolve, reject) => {
                setAuth({ returns: 'keysOnly', promise: { resolve, reject }, params: { ...style, useBiometrics: false, passcodeLength } });
            });
        }

        throw Error('Failed to load keys');
    }, [auth]);

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
            setAuth({ returns: 'keysWithPasscode', promise: { resolve, reject }, params: { ...style, useBiometrics: false, passcodeLength } });
        });
    }, [auth]);

    return (
        <AuthWalletKeysContext.Provider value={{ authenticate, authenticateWithPasscode }}>
            {props.children}
            {auth !== null && (
                <Animated.View
                    style={[
                        {
                            backgroundColor: auth.params?.backgroundColor ?? Theme.background,
                            flexGrow: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    ]}
                    exiting={FadeOut}
                    entering={FadeIn}
                >
                    <PasscodeInput
                        style={{ marginTop: 49 }}
                        title={t('security.passcodeSettings.enterCurrent')}
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
                                Alert.alert(t('security.passcodeSettings.error'));
                                auth.promise.reject();
                            }

                            // Remove auth view
                            setAuth(null);
                        }}
                        passcodeLength={auth.params?.passcodeLength}
                        onRetryBiometrics={
                            (auth.params?.useBiometrics && auth.returns === 'keysOnly')
                                ? async () => {
                                    try {
                                        const acc = getCurrentAddress();
                                        let keys = await loadWalletKeys(acc.secretKeyEnc);
                                        auth.promise.resolve(keys);
                                        // Remove auth view
                                        setAuth(null);
                                    } catch {
                                        Alert.alert(t('secure.onBiometricsError'));
                                        warn('Failed to load wallet keys');
                                    }
                                }
                                : undefined
                        }
                    />
                    {auth.params?.cancelable && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: Platform.OS === 'android' ? safeAreaInsets.top + 24 : 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => {
                                auth.promise.reject();
                                setAuth(null);
                            }}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.cancel')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}
        </AuthWalletKeysContext.Provider>
    );
});

export function useKeysAuth() {
    const context = React.useContext(AuthWalletKeysContext);
    if (!context) {
        throw new Error('useKeysAuth must be used within a AuthWalletKeysContextProvider');
    }
    return context;
}