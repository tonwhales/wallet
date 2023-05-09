import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { WalletKeys, loadWalletKeys, loadWalletKeysWithPassword } from '../../storage/walletKeys';
import { PasscodeInput } from './PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useEngine } from '../../engine/Engine';
import { getCurrentAddress } from '../../storage/appState';

export const AuthWalletKeysContext = React.createContext<{
    authenticate: () => Promise<WalletKeys>,
    authenticateWithPasscode: () => Promise<WalletKeys>,
} | null>(null);

export const AuthWalletKeysContextProvider = React.memo((props: { children?: any }) => {
    const engine = useEngine();
    const settings = engine.products.settings;
    const passcodeState = settings.usePasscodeState();
    const { Theme } = useAppConfig();
    const [promise, setPromise] = useState<{ resolve: (keys: WalletKeys) => void, reject: () => void } | null>(null);

    const authenticate = useCallback(async () => {
        if (promise) {
            promise.reject();
        }
        setPromise(null);
        try {
            const account = getCurrentAddress();
            const keys = await loadWalletKeys(account.secretKeyEnc);
            return keys;
        } catch (e) {
            const passcodeKeys = new Promise<WalletKeys>((resolve, reject) => {
                if (passcodeState !== PasscodeState.Set) {
                    setPromise(null);
                    reject();
                    return;
                }
                setPromise({ resolve, reject });
            });

            return (await passcodeKeys);
        }
    }, [promise, passcodeState]);

    const authenticateWithPasscode = useCallback(() => {
        if (promise) {
            promise.reject();
        }
        setPromise(null);
        return new Promise<WalletKeys>((resolve, reject) => {
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setPromise({ resolve, reject });
        });
    }, [promise, passcodeState]);

    return (
        <AuthWalletKeysContext.Provider value={{ authenticate, authenticateWithPasscode }}>
            {props.children}
            {promise !== null && (
                <KeyboardAvoidingView
                    style={{
                        flexGrow: 1,
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Animated.View
                        style={[
                            {
                                backgroundColor: Theme.background,
                                flexGrow: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            },
                        ]}
                        exiting={FadeOut}
                        entering={FadeIn}
                    >
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            {t('security.passcodeSettings.enterCurrent')}
                        </Text>
                        <PasscodeInput onEntered={async (pass) => {
                            if (!pass) {
                                promise.reject();
                                setPromise(null);
                                return;
                            }
                            const keys = await loadWalletKeysWithPassword(pass);
                            promise.resolve(keys);
                            setPromise(null);
                        }} />
                    </Animated.View>
                </KeyboardAvoidingView>
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

