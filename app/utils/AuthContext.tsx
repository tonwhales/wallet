import React, { useCallback, useState } from "react";
import { AuthComponent } from "../components/Security/AuthComponent";

const AuthContext = React.createContext<{
    authenticate: (props: {
        onSuccess?: () => void,
        onError?: () => void,
        onCancel?: () => void
    }) => void
} | undefined>(undefined);

export const AuthLoader = React.memo(({ children }: { children: any }) => {
    const [authState, setAuthState] = useState<{
        onSuccess?: () => void,
        onError?: () => void,
        onCancel?: () => void
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
            onCancel?: () => void
        }) => {
            setAuthState({
                onSuccess: finishAuth(props.onSuccess),
                onError: finishAuth(props.onError),
                onCancel: finishAuth(props.onCancel)
            });
        },
        [],
    );

    return (
        <AuthContext.Provider value={{ authenticate }}>
            {children}
            {authState && <AuthComponent {...authState} />}
        </AuthContext.Provider>
    );
});

export function useAuth() {
    let v = React.useContext(AuthContext);
    return v;
}