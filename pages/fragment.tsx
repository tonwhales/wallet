import * as React from 'react';
// import { DefaultErrorBoundary } from '../components/DefaultErrorBoundary';
// import { Suspense } from '../components/Suspence';
// import { GlobalLoaderProvider } from '../components/useGlobalLoader';

export function fragment<T = {}>(Component: React.ComponentType<T>): React.ComponentType<T> {
    return React.memo((props) => {
        return (
            // <GlobalLoaderProvider>
            //     <DefaultErrorBoundary>
            //         <Suspense>
                        <Component {...props} />
            //         </Suspense>
            //     </DefaultErrorBoundary>
            // </GlobalLoaderProvider>
        );
    });
}