import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Platform, Pressable, Text } from 'react-native';
import { WalletKeys, loadWalletKeys, loadWalletKeysWithPassword } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsMigrated, getBiometricsEncKey, passcodeStateKey, getBiometricsState, BiometricsState } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useEngine } from '../../engine/Engine';
import { getCurrentAddress } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { warn } from '../../utils/log';
import { Address } from 'ton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AuthStyle = {
    backgroundColor?: string,
    cancelable?: boolean,
    useBiometrics?: boolean,
}

export type AuthProps = {
    promise: { resolve: (keys: WalletKeys) => void, reject: () => void },
    style?: AuthStyle
}

export type AuthWalletKeysType = {
    authenticate: (style?: AuthStyle) => Promise<WalletKeys>,
    authenticateWithPasscode: (style?: AuthStyle) => Promise<WalletKeys>,
}

export function getPasscodeState(address: Address, isTestnet: boolean) {
    return (storage.getString(`${address.toFriendly({ testOnly: isTestnet })}/${passcodeStateKey}`) ?? null) as PasscodeState | null;
}

export const AuthWalletKeysContext = React.createContext<AuthWalletKeysType | null>(null);

export const AuthWalletKeysContextProvider = React.memo((props: { children?: any }) => {
    const engine = useEngine();
    const safeAreaInsets = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();
    const [auth, setAuth] = useState<AuthProps | null>(null);

    const authenticate = useCallback(async (style?: AuthStyle) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        const acc = getCurrentAddress();

        // Check if migrated to new Passcode and Biometrics keys system
        const migrated = getBiometricsMigrated(AppConfig.isTestnet);

        try {
            if (migrated) {
                const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);

                const biometricsEncKey = getBiometricsEncKey(acc.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                const biometricsState = getBiometricsState(acc.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                const useBiometrics = biometricsState === BiometricsState.InUse && !!biometricsEncKey;

                if (useBiometrics) {
                    // Should never happen
                    if (!biometricsEncKey) {
                        throw new Error('Biometrics key not found');
                    }

                    try {
                        const keys = await loadWalletKeys(biometricsEncKey);
                        return keys;
                    } catch (e) {
                        warn('Failed to load wallet keys with biometrics');
                        if (passcodeState === PasscodeState.Set) {
                            return new Promise<WalletKeys>((resolve, reject) => {
                                setAuth({ promise: { resolve, reject }, style: { ...style, useBiometrics } });
                            });
                        }
                    }
                }

                if (passcodeState === PasscodeState.Set) {
                    return new Promise<WalletKeys>((resolve, reject) => {
                        setAuth({ promise: { resolve, reject }, style: { ...style, useBiometrics } });
                    });
                }

                const keys = await loadWalletKeys(acc.secretKeyEnc);
                return keys;
            } else {
                try {
                    const keys = await loadWalletKeys(acc.secretKeyEnc);
                    return keys;
                } catch (e) {
                    const passcodeKeys = new Promise<WalletKeys>((resolve, reject) => {
                        const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
                        if (passcodeState !== PasscodeState.Set) {
                            setAuth(null);
                            reject();
                            return;
                        }
                        setAuth({ promise: { resolve, reject }, style: { ...style, useBiometrics: true } });
                    });
                    return passcodeKeys;
                }
            }
        } catch (e) {
            warn('Failed to load wallet keys');
            throw Error('Failed to load wallet keys');
        }
    }, [auth]);

    // Passcode only auth
    const authenticateWithPasscode = useCallback((style?: AuthStyle) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        return new Promise<WalletKeys>((resolve, reject) => {
            const acc = getCurrentAddress();
            const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setAuth({ promise: { resolve, reject }, style });
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
                        title={t('security.passcodeSettings.enterCurrent')}
                        onEntered={async (pass) => {
                            if (!pass) {
                                auth.promise.reject();
                                setAuth(null);
                                return;
                            }
                            const acc = getCurrentAddress();
                            try {
                                const keys = await loadWalletKeysWithPassword(
                                    acc.address.toFriendly({ testOnly: engine.isTestnet }),
                                    pass
                                );
                                auth.promise.resolve(keys);
                            } catch (e) {
                                auth.promise.reject();
                            }
                            setAuth(null);
                        }}
                        onRetryBiometrics={auth.style?.useBiometrics ? async () => {
                            try {
                                const acc = getCurrentAddress();
                                const migrated = getBiometricsMigrated(AppConfig.isTestnet);
                                let keys: WalletKeys;
                                if (migrated) {
                                    const biometricsEncKey = getBiometricsEncKey(acc.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                                    if (!biometricsEncKey) {
                                        warn('Biometrics key not found');
                                        throw new Error('Biometrics key not found');
                                    }
                                    keys = await loadWalletKeys(biometricsEncKey);
                                } else {
                                    keys = await loadWalletKeys(acc.secretKeyEnc);
                                }
                                auth.promise.resolve(keys);
                                setAuth(null);
                            } catch (e) {
                                warn('Failed to load wallet keys');
                            }
                        } : undefined}
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

