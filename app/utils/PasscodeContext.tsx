import React, { useCallback, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PasscodeAuthType, PasscodeComponent } from "../components/Passcode/PasscodeComponent";
import { getCurrentAddress } from "../storage/appState";
import { encryptDataWithPasscode } from "../storage/secureStorage";
import { loadWalletKeysWithPasscode, WalletKeys } from "../storage/walletKeys";

export type PasscodeContextType = {
    authenticateAsync: (cancelable?: boolean) => Promise<WalletKeys>,
    encrypthWithPasscodeAsync: (mnemonics: string, cancelable?: boolean) => Promise<Buffer>
} | undefined

const PasscodeContext = React.createContext<PasscodeContextType>(undefined);

export const PasscodeAuthLoader = React.memo(({ children }: { children: any }) => {
    const [authState, setAuthState] = useState<{
        onSuccess?: (passcode: string) => void,
        onError?: () => void,
        onCancel?: () => void,
        type?: PasscodeAuthType
    }>();

    const dismiss = useCallback(
        (call?: () => void) => {
            if (call) {
                return () => {
                    setAuthState(undefined);
                    call();
                }
            }
            return undefined;
        },
        [],
    );

    const authenticateAsync = useCallback(
        async () => {
            return await new Promise<WalletKeys>((resolve, reg) => {
                setAuthState({
                    onSuccess: (passcode: string) => {
                        (async () => {
                            const acc = getCurrentAddress();
                            const res = await loadWalletKeysWithPasscode(acc.secretKeyEnc, passcode);
                            setAuthState(undefined);
                            resolve(res);
                        })();
                    },
                    onError: dismiss(() => {
                        reg('Passcode Auth error');
                    }),
                    onCancel: dismiss(() => {
                        reg('Passcode Auth canceled');
                    }),
                    type: 'confirm'
                });
            });
        },
        [],
    );

    const encrypthWithPasscodeAsync = useCallback(
        async (mnemonics: string) => {
            return await new Promise<Buffer>((resolve, reg) => {
                setAuthState({
                    onSuccess: (passcode: string) => {
                        (async () => {
                            const res = await encryptDataWithPasscode(Buffer.from(mnemonics), passcode);
                            setAuthState(undefined);
                            resolve(res);
                        })();
                    },
                    onError: dismiss(() => {
                        reg('Passcode Auth error');
                    }),
                    onCancel: dismiss(() => {
                        reg('Passcode Auth canceled');
                    }),
                    type: 'new'
                });
            });
        },
        [],
    );

    return (
        <PasscodeContext.Provider value={{ authenticateAsync, encrypthWithPasscodeAsync }}>
            {children}
            {authState && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                    }}
                    exiting={FadeOut}
                    entering={FadeIn}
                >
                    <PasscodeComponent {...authState} />
                </Animated.View>
            )}
        </PasscodeContext.Provider>
    );
});

export function usePasscodeAuth() {
    let v = React.useContext(PasscodeContext);
    return v;
}