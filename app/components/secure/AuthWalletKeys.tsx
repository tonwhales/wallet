import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Platform, Pressable, Text } from 'react-native';
import { WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsState, BiometricsState, getPasscodeState } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { getCurrentAddress } from '../../storage/appState';
import { warn } from '../../utils/log';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AuthStyle = {
    backgroundColor?: string,
    cancelable?: boolean,
    useBiometrics?: boolean,
}

export type AuthProps =
    | {
        type: 'keysWithPasscode',
        promise: { resolve: (res: { keys: WalletKeys, passcode: string }) => void, reject: () => void }
        style?: AuthStyle
    } |
    {
        type: 'keysOnly',
        promise: { resolve: (keys: WalletKeys) => void, reject: () => void }
        style?: AuthStyle
    }

export type AuthWalletKeysType = {
    authenticate: (style?: AuthStyle) => Promise<WalletKeys>,
    authenticateWithPasscode: (style?: AuthStyle) => Promise<{ keys: WalletKeys, passcode: string }>,
}

export const AuthWalletKeysContext = React.createContext<AuthWalletKeysType | null>(null);

export const AuthWalletKeysContextProvider = React.memo((props: { children?: any }) => {
    const safeAreaInsets = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const [auth, setAuth] = useState<AuthProps | null>(null);

    const authenticate = useCallback(async (style?: AuthStyle) => {

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

        if (useBiometrics) {
            try {
                const keys = loadWalletKeys(acc.secretKeyEnc);
                return keys;
            } catch (e) {
                warn('Failed to load wallet keys with biometrics');

                // Retry with passcode
                if (passcodeState === PasscodeState.Set) {
                    return new Promise<WalletKeys>((resolve, reject) => {
                        setAuth({ type: 'keysOnly', promise: { resolve, reject }, style: { useBiometrics: true, ...style } });
                    });
                }
            }
        }

        if (passcodeState === PasscodeState.Set) {
            return new Promise<WalletKeys>((resolve, reject) => {
                setAuth({ type: 'keysOnly', promise: { resolve, reject }, style: { ...style, useBiometrics: false } });
            });
        }

        throw Error('Failed to load keys');
    }, [auth]);

    // Passcode only auth
    const authenticateWithPasscode = useCallback((style?: AuthStyle) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        return new Promise<{ keys: WalletKeys, passcode: string }>((resolve, reject) => {
            const passcodeState = getPasscodeState();
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setAuth({ type: 'keysWithPasscode', promise: { resolve, reject }, style: { ...style, useBiometrics: false } });
        });
    }, [auth]);

    return (
        <AuthWalletKeysContext.Provider value={{ authenticate, authenticateWithPasscode }}>
            {props.children}
            {auth !== null && (
                <Animated.View
                    style={[
                        {
                            backgroundColor: auth.style?.backgroundColor ?? Theme.background,
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
                                if (auth.type === 'keysWithPasscode') {
                                    auth.promise.resolve({ keys, passcode: pass });
                                } else {
                                    auth.promise.resolve(keys);
                                }
                            } catch {
                                auth.promise.reject();
                            }

                            // Remove auth view
                            setAuth(null);
                        }}
                        onRetryBiometrics={
                            (auth.style?.useBiometrics && auth.type === 'keysOnly')
                                ? async () => {
                                    try {
                                        const acc = getCurrentAddress();
                                        let keys = await loadWalletKeys(acc.secretKeyEnc);
                                        auth.promise.resolve(keys);
                                        // Remove auth view
                                        setAuth(null);
                                    } catch {
                                        warn('Failed to load wallet keys');
                                    }
                                }
                                : undefined
                        }
                    />
                    {auth.style?.cancelable && (
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