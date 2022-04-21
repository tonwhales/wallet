import React, { useState } from "react";
import { PasscodeAuthComponent } from "../components/Passcode/PasscodeAuthComponent";

export type PasscodeContextType = {
    authenticateAsync: (cancelable?: boolean) => Promise<{ type: 'success', passcode: string } | 'error' | 'canceled'>
} | undefined

const PasscodeContext = React.createContext<PasscodeContextType>(undefined);

export const PasscodeAuthLoader = React.memo(({ children }: { children: any }) => {
    const [authState, setAuthState] = useState<{
        onSuccess?: (passcode: string) => void,
        onError?: () => void,
        onCancel?: () => void,
        fallbackToPasscode?: boolean
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

    const authenticateAsync = async (cancelable?: boolean) => {
        return await new Promise<{ type: 'success', passcode: string } | 'error' | 'canceled'>((res, reg) => {
            setAuthState({
                onSuccess: (passcode: string) => finishAuth(() => res({ type: 'success', passcode })),
                onError: finishAuth(() => res('error')),
                onCancel: cancelable ? finishAuth(() => res('canceled')) : undefined
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