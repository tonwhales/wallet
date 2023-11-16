import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ConnectAppComponent } from './components/ConnectAppComponent';
import { useAppManifest } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useMemo } from 'react';
import { useTonConnectExtensions } from '../../engine/hooks';
import { extensionKey } from '../../engine/hooks/dapps/useAddExtension';

export const ConnectAppFragment = fragment(() => {
    const theme = useTheme();
    const url = (useRoute().params as any).url as string;
    const appKey = extensionKey(url)
    const [inastalledConnectApps,] = useTonConnectExtensions();
    const manifestUrl = useMemo(() => {
        return inastalledConnectApps?.[appKey]?.manifestUrl;
    }, [inastalledConnectApps, appKey]);
    const appManifest = useAppManifest(manifestUrl ?? '');
    const safeArea = useSafeAreaInsets();

    if (!appManifest) {
        throw Error('No App Data');
    }
    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: theme.backgroundPrimary
        }}>
            <StatusBar style={'dark'} />
            <ConnectAppComponent
                endpoint={url}
                title={appManifest.name}
            />
        </View>
    );
});