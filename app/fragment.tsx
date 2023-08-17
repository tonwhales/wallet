import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { PriceLoader } from './engine/legacy/PriceContext';
import { useRoute } from '@react-navigation/native';
import { useTrackScreen } from './analytics/mixpanel';
import { useAppConfig } from './utils/AppConfigContext';
import { AuthWalletKeysContextProvider } from './components/secure/AuthWalletKeys';

export function fragment<T>(
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
            <GlobalLoaderProvider>
                <AuthWalletKeysContextProvider>
                    <PriceLoader>
                        <Component {...props} />
                    </PriceLoader>
                </AuthWalletKeysContextProvider>
            </GlobalLoaderProvider>
        );
    });
}