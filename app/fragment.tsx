import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { useRoute } from '@react-navigation/native';
import { useTrackScreen } from './analytics/mixpanel';
import { AuthWalletKeysContextProvider } from './components/secure/AuthWalletKeys';
import { useNetwork } from './engine/hooks/useNetwork';

export function fragment<T>(
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
            <GlobalLoaderProvider>
                <AuthWalletKeysContextProvider>
                    <Component {...props} />
                </AuthWalletKeysContextProvider>
            </GlobalLoaderProvider>
        );
    });
}