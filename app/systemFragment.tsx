import * as React from 'react';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { Host } from 'react-native-portalize';
import { Context } from 'react-native-portalize/lib/Host';

export function systemFragment<T = {}>(Component: React.ComponentType<T>): React.ComponentType<T> {
    return React.memo((props) => {
        const ctx = React.useContext(Context);
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