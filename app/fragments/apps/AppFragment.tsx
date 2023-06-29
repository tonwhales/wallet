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
import { warn } from '../../utils/log';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const AppFragment = fragment(() => {
    const navigation = useTypedNavigation();
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

    // Should never happen
    if (!appData) {
        warn('No App Data');
        navigation.goBack();
        return null;
    }

    // Should never happen
    if (!key) {
        warn('No Domain Key');
        navigation.goBack();
        return null;
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