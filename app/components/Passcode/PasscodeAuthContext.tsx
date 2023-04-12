import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { WalletKeys, loadWalletKeysWithPassword } from '../../storage/walletKeys';
import { PasscodeInput } from './PasscodeInput';
import { t } from '../../i18n/t';
import { storage } from '../../storage/storage';
import { PasscodeState, passcodeStateKey } from '../../storage/secureStorage';
import { Theme } from '../../Theme';

export const PasscodeAuthContext = React.createContext<{ authenticate: () => Promise<WalletKeys> } | null>(null);

export const PasscodeAuthContextProvider = React.memo((props: { children?: any }) => {
    const [promise, setPromise] = useState<{ resolve: (keys: WalletKeys) => void, reject: () => void } | null>(null);

    const authenticate = useCallback(() => {
        setPromise(null);
        return new Promise<WalletKeys>((resolve, reject) => {
            if (storage.getString(passcodeStateKey) !== PasscodeState.Set) {
                reject();
            }
            setPromise({ resolve, reject });
        });
    }, []);

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

