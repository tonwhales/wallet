import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../engine/Engine';
import { ConnectAppComponent } from './components/ConnectAppComponent';
import { Theme } from '../../Theme';

export const ConnectAppFragment = fragment(() => {
    const engine = useEngine();
    const url = (useRoute().params as any).url as string;
    const appData = engine.products.tonConnect.useAppManifest(url);
    const safeArea = useSafeAreaInsets();

    if (!appData) {
        throw Error('No App Data');
    }
    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light': 'dark'} />

            <ConnectAppComponent
                endpoint={url}
                title={appData.name}
            />
        </View>
    );
});