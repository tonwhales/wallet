import * as React from 'react';
// import { DefaultErrorBoundary } from '../components/DefaultErrorBoundary';
// import { Suspense } from '../components/Suspence';
import { GlobalLoaderProvider } from './components/useGlobalLoader';
import { Host } from 'react-native-portalize';
import { Context } from 'react-native-portalize/lib/Host';
import { PriceLoader } from './engine/PriceContext';

export function fragment<T = {}>(Component: React.ComponentType<T>): React.ComponentType<T> {
    return React.memo((props) => {
        const ctx = React.useContext(Context);
        if (ctx) {
            return (
                <GlobalLoaderProvider>
                    <PriceLoader>
                        <Component {...props} />
                    </PriceLoader>
                </GlobalLoaderProvider>
            );
        }
        return (
            <GlobalLoaderProvider>
                <PriceLoader>
                    <Host>
                        <Component {...props} />
                    </Host>
                </PriceLoader>
            </GlobalLoaderProvider>
        );
    });
}