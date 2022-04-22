import React, { useCallback, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PasscodeAuth } from "../components/Passcode/PasscodeAuth";
import { PasscodeAuthType } from "../components/Passcode/PasscodeComponent";

export type PasscodeAuthResult =
    { type: 'success', passcode: string }
    | { type: 'error' }
    | { type: 'canceled' };

export type PasscodeContextType = {
    authenticateAsync: (type: PasscodeAuthType, cancelable?: boolean) => Promise<PasscodeAuthResult>
} | undefined

const PasscodeContext = React.createContext<PasscodeContextType>(undefined);

export const PasscodeAuthLoader = React.memo(({ children }: { children: any }) => {
    console.log('[PasscodeAuthLoader]');
    const [authState, setAuthState] = useState<{
        onSuccess: (passcode: string) => void,
        onError?: () => void,
        onCancel?: () => void,
        type: PasscodeAuthType
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
        async (type: PasscodeAuthType) => {
            return await new Promise<PasscodeAuthResult>((resolve, reg) => {
                setAuthState({
                    onSuccess: (passcode: string) => {
                        console.log('[authenticateAsync]', { passcode });
                        setAuthState(undefined);
                        resolve({ type: 'success', passcode });
                    },
                    onError: dismiss(() => resolve({ type: 'error' })),
                    onCancel: dismiss(() => resolve({ type: 'canceled' })),
                    type: type
                });
            });
        },
        [],
    );

    return (
        <PasscodeContext.Provider value={{ authenticateAsync }}>
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
                    <PasscodeAuth {...authState} />
                </Animated.View>
            )}
        </PasscodeContext.Provider>
    );
});

export function usePasscodeAuth() {
    let v = React.useContext(PasscodeContext);
    return v;
}