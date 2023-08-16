import React, { useCallback, useEffect, useState } from 'react';
import Animated, { FadeOutUp, SlideInDown } from 'react-native-reanimated';
import { Alert, Platform, Pressable, Text } from 'react-native';
import { WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsState, BiometricsState, getPasscodeState, passcodeLengthKey } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { getCurrentAddress } from '../../storage/appState';
import { warn } from '../../utils/log';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sharedStoragePersistence, storage, storagePersistence } from '../../storage/storage';
import { clearHolders } from '../../fragments/LogoutFragment';
import { useReboot } from '../../utils/RebootContext';
import { useEngine } from '../../engine/Engine';
import { useActionSheet } from '@expo/react-native-action-sheet';

export type AuthParams = {
    backgroundColor?: string,
    paddingTop?: number,
    cancelable?: boolean,
    useBiometrics?: boolean,
    passcodeLength?: number,
    showResetOnMaxAttempts?: boolean,
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
    const engine = useEngine();
    const { showActionSheetWithOptions } = useActionSheet();
    const safeAreaInsets = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const reboot = useReboot();

    const [auth, setAuth] = useState<AuthProps | null>(null);
    const [attempts, setAttempts] = useState(0);

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

    const onFullReset = useCallback(() => {
        storage.clearAll();
        sharedStoragePersistence.clearAll();
        storagePersistence.clearAll();

        clearHolders(engine);
        reboot();
    }, [auth, engine]);

    const fullResetActionSheet = React.useCallback(() => {
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
                    onFullReset();
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [onFullReset]);

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
                            backgroundColor: auth.params?.backgroundColor ?? Theme.white,
                            flexGrow: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: auth.params?.paddingTop ?? 0,
                            paddingBottom: safeAreaInsets.bottom === 0 ? 120 : safeAreaInsets.bottom,
                        },
                    ]}
                    exiting={FadeOutUp}
                    entering={SlideInDown}
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
                                setAttempts(attempts + 1);

                                // Every 5 tries
                                if (
                                    attempts > 0 &&
                                    attempts % 5 === 0
                                ) {
                                    auth.promise.reject();
                                    setAuth(null);
                                    return;
                                }

                                throw Error('Failed to load keys');
                            }

                            // Remove auth view
                            setAuth(null);
                        }}
                        onLogoutAndReset={
                            (auth.params?.showResetOnMaxAttempts
                                && attempts > 0
                                && attempts % 5 === 0
                            )
                                ? fullResetActionSheet
                                : undefined
                        }
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
                                    position: 'absolute',
                                    top: Platform.OS === 'android'
                                        ? safeAreaInsets.top + 24 + (auth.params?.paddingTop ?? 0)
                                        : 24 + (auth.params?.paddingTop ?? 0),
                                    right: 16,
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