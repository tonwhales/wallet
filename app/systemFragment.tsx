import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { useTrackScreen } from './analytics/mixpanel';
import { useRoute } from '@react-navigation/native';
import { useAppConfig } from './utils/AppConfigContext';
import { AuthWalletKeysContextProvider } from './components/secure/AuthWalletKeys';

export function systemFragment<T>(
    Component: React.ComponentType<T>, 
    doNotTrack?: boolean
): React.ComponentType<React.PropsWithRef<T & JSX.IntrinsicAttributes>> {
    return React.memo((props: T & JSX.IntrinsicAttributes) => {
        const { AppConfig } = useAppConfig();

        const route = useRoute();
        const name = route.name;
        if (!doNotTrack) {
            useTrackScreen(name, AppConfig.isTestnet);
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