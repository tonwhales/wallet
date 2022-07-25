import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { Host } from 'react-native-portalize';
import { Context } from 'react-native-portalize/lib/Host';
import { useTrackScreen } from './analytics/mixpanel';
import { useRoute } from '@react-navigation/native';

export function systemFragment<T = {}>(Component: React.ComponentType<T>, doNotTrack?: boolean): React.ComponentType<T> {
    return React.memo((props) => {
        const ctx = React.useContext(Context);

        const route = useRoute();
        const name = route.name;
        if (!doNotTrack) {
            useTrackScreen(name);
        }

        if (ctx) {
            return (
                <GlobalLoaderProvider>
                    <Component {...props} />
                </GlobalLoaderProvider>
            );
        }
        return (
            <GlobalLoaderProvider>
                <Host>
                    <Component {...props} />
                </Host>
            </GlobalLoaderProvider>
        );
    });
}