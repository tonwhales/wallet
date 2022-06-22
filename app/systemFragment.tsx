import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { Host } from 'react-native-portalize';
import { Context } from 'react-native-portalize/lib/Host';
import { trackScreen } from './analytics/mixpanel';
import { useNavigation, useRoute } from '@react-navigation/native';

export function systemFragment<T = {}>(Component: React.ComponentType<T>): React.ComponentType<T> {
    return React.memo((props) => {
        const ctx = React.useContext(Context);

        const route = useRoute();
        const name = route.name;
        const navigation = useNavigation();
        trackScreen(name);

        React.useEffect(() => navigation.addListener('beforeRemove', (e) => {
            trackScreen(name, { back: true });
        }), []);

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