import React, { useCallback, useState } from "react";
import { AuthComponent } from "../components/Security/AuthComponent";
import { Settings } from "../storage/settings";
import { backoff } from "./time";


export type AuthContextType = {
    authenticate: (props: {
        onSuccess?: () => void,
        onError?: () => void,
        onCancel?: () => void,
        fallbackToPasscode?: boolean
    }) => void,
    authenticateAsync: () => Promise<'success' | 'error' | 'canceled'>
} | undefined

const AuthContext = React.createContext<AuthContextType>(undefined);

export const AuthLoader = React.memo(({ children }: { children: any }) => {
    const [authState, setAuthState] = useState<{
        onSuccess?: () => void,
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


    const authenticate = useCallback(
        (props: {
            onSuccess?: () => void,
            onError?: () => void,
            onCancel?: () => void,
            fallbackToPasscode?: boolean
        }) => {
            setAuthState({
                onSuccess: finishAuth(props.onSuccess),
                onError: finishAuth(props.onError),
                onCancel: finishAuth(props.onCancel),
                fallbackToPasscode: !!Settings.getPasscode()
                    ? props.fallbackToPasscode
                    : undefined
            });
        },
        [],
    );

    const authenticateAsync = async () => {
        console.log('[authenticateAsync]')
        return await new Promise<'success' | 'error' | 'canceled'>((res, reg) => {
            console.log('[authenticateAsync]', 'Promise');
            setAuthState({
                onSuccess: finishAuth(() => res('success')),
                onError: finishAuth(() => res('error')),
            });
        });
    };

    return (
        <AuthContext.Provider value={{ authenticate, authenticateAsync }}>
            {children}
            {authState && <AuthComponent {...authState} />}
        </AuthContext.Provider>
    );
});

export function useAuth() {
    console.log('[useAuth]');
    let v = React.useContext(AuthContext);
    console.log('[useAuth]', { v });
    return v;
}