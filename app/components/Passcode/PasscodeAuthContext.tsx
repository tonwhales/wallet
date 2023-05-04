import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { WalletKeys, loadWalletKeysWithPassword } from '../../storage/walletKeys';
import { PasscodeInput } from './PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useEngine } from '../../engine/Engine';

export const PasscodeAuthContext = React.createContext<{ authenticate: () => Promise<WalletKeys> } | null>(null);

export const PasscodeAuthContextProvider = React.memo((props: { children?: any }) => {
    const engine = useEngine();
    const settings = engine.products.settings;
    const passcodeState = settings.usePasscodeState();
    const { Theme } = useAppConfig();
    const [promise, setPromise] = useState<{ resolve: (keys: WalletKeys) => void, reject: () => void } | null>(null);

    const authenticate = useCallback(() => {
        setPromise(null);
        return new Promise<WalletKeys>((resolve, reject) => {
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setPromise({ resolve, reject });
        });
    }, [passcodeState]);

    return (
        <PasscodeAuthContext.Provider value={{ authenticate }}>
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
                            try {
                                const keys = await loadWalletKeysWithPassword(pass);
                                promise.resolve(keys);
                                setPromise(null);
                            } catch (e) {
                                promise.reject();
                            }
                        }} />
                    </Animated.View>
                </KeyboardAvoidingView>
            )}
        </PasscodeAuthContext.Provider>
    );
});

export function usePasscodeAuth() {
    const context = React.useContext(PasscodeAuthContext);
    if (!context) {
        throw new Error('usePasscodeAuth must be used within a PasscodeAuthContextProvider');
    }
    return context;
}

