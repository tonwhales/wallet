import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ConnectAppComponent } from './components/ConnectAppComponent';
import { useAppManifest } from '../../engine/hooks/dapps/useAppManifest';
import { useTheme } from '../../engine/hooks/useTheme';
import { extensionKey } from '../../engine/effects/dapps/useAddExtension';
import { useMemo } from 'react';
import { useTonConnectExtensions } from '../../engine/hooks/dapps/useTonConnectExtenstions';

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
            backgroundColor: theme.background
        }}>
            <StatusBar style={'dark'} />

            <ConnectAppComponent
                endpoint={url}
                title={appManifest.name}
            />
        </View>
    );
});