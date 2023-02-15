import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useEngine } from '../../engine/Engine';

export const ConnectAppFragment = fragment(() => {
    const engine = useEngine();
    const url = (useRoute().params as any).url as string;
    const domain = extractDomain(url);
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const color = appData && appData.color ? appData.color : '#fff';
    const c = Color(color);
    const dark = c.isDark();
    const fontColor = dark ? '#fff' : '#000';
    const key = engine.products.keys.getDomainKey(domain);
    if (!appData) {
        throw Error('No App Data');
    }
    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: color
        }}>
            <StatusBar style={dark ? 'light' : 'dark'} />

            <AppComponent
                endpoint={url}
                color={color}
                dark={dark}
                foreground={fontColor}
                title={appData.title}
                domainKey={key}
            />
        </View>
    );
});