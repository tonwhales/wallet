import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ConnectAppComponent } from './components/ConnectAppComponent';
import { useAppManifest } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useMemo } from 'react';
import { useTonConnectExtensions } from '../../engine/hooks';
import { extensionKey } from '../../engine/hooks/dapps/useAddExtension';
import { StatusBar } from 'expo-status-bar';

export const ConnectAppFragment = fragment(() => {
    const theme = useTheme();
    const url = (useRoute().params as any).url as string;
    const appKey = extensionKey(url)
    const [inastalledConnectApps,] = useTonConnectExtensions();
    const manifestUrl = useMemo(() => {
        return inastalledConnectApps?.[appKey]?.manifestUrl;
    }, [inastalledConnectApps, appKey]);
    const appManifest = useAppManifest(manifestUrl ?? '');

    if (!appManifest) {
        throw Error('No App Data');
    }
    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ConnectAppComponent
                endpoint={url}
                title={appManifest.name}
            />
        </View>
    );
});