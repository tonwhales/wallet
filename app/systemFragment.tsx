import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { useTrackScreen } from './analytics/mixpanel';
import { useRoute } from '@react-navigation/native';
import { AuthWalletKeysContextProvider } from './components/secure/AuthWalletKeys';
import { useNetwork } from './engine/hooks/useNetwork';

export function systemFragment<T>(
    Component: React.ComponentType<T>, 
    doNotTrack?: boolean
): React.ComponentType<React.PropsWithRef<T & JSX.IntrinsicAttributes>> {
    return React.memo((props: T & JSX.IntrinsicAttributes) => {
        const { isTestnet } = useNetwork();

        const route = useRoute();
        const name = route.name;
        if (!doNotTrack) {
            useTrackScreen(name, isTestnet);
        }

        return (
            <AuthWalletKeysContextProvider>
                <GlobalLoaderProvider>
                    <Component {...props} />
                </GlobalLoaderProvider>
            </AuthWalletKeysContextProvider>
        );
    });
}