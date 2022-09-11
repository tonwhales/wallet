import * as React from 'react';
import { View } from 'react-native';
import { LoadingIndicator } from './components/LoadingIndicator';

export const SuspenseLoader = () => {
    return (
        <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
        }} >
            <LoadingIndicator simple/>
        </View>
    );
}

export const Suspense = React.memo((props: { children?: any }) => {
    return (
        <React.Suspense fallback={<SuspenseLoader />}>
            {props.children}
        </React.Suspense>
    )
});