import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { AuthWalletKeysContextProvider } from './components/secure/AuthWalletKeys';
import { ToastProvider } from './components/toast/ToastProvider';

export function fragment<T>(Component: React.ComponentType<T>): React.ComponentType<React.PropsWithRef<T & JSX.IntrinsicAttributes>> {
    return React.memo((props: T & JSX.IntrinsicAttributes) => {
        return (
            <GlobalLoaderProvider>
                <AuthWalletKeysContextProvider>
                    <ToastProvider>
                        <Component {...props} />
                    </ToastProvider>
                </AuthWalletKeysContextProvider>
            </GlobalLoaderProvider>
        );
    });
}