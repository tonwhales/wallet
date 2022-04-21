import React, { useState } from "react";
import { PasscodeAuthComponent } from "../components/Passcode/PasscodeAuthComponent";
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
    const [authState, setAuthState] = useState<{
        onSuccess: (passcode: string) => void,
        onError?: () => void,
        onCancel?: () => void,
        type: PasscodeAuthType
    }>();

    function finishAuth(call?: () => void) {
        if (call) {
            return () => {
                setAuthState(undefined);
                call();
            }
        }
        return undefined;
    }

    const authenticateAsync = async (type: PasscodeAuthType, cancelable?: boolean) => {
        return await new Promise<PasscodeAuthResult>((resolve, reg) => {
            setAuthState({
                onSuccess: (passcode: string) => {
                    console.log('[authenticateAsync]', { passcode });
                    setAuthState(undefined);
                    resolve({ type: 'success', passcode });
                },
                onError: finishAuth(() => resolve({ type: 'error' })),
                onCancel: cancelable ? finishAuth(() => resolve({ type: 'canceled' })) : undefined,
                type: type
            });
        });
    };

    return (
        <PasscodeContext.Provider value={{ authenticateAsync }}>
            {children}
            {authState && <PasscodeAuthComponent {...authState} />}
        </PasscodeContext.Provider>
    );
});

export function usePasscodeAuth() {
    let v = React.useContext(PasscodeContext);
    return v;
}