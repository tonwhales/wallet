import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useAppData } from '../../engine/hooks';
import { getDomainKey } from '../../engine/state/domainKeys';

export const AppFragment = fragment(() => {
    const url = (useRoute().params as any).url as string;
    const domain = extractDomain(url);
    const appData = useAppData(url);
    const safeArea = useSafeAreaInsets();
    const color = appData && appData.color ? appData.color : '#fff';
    const c = Color(color);
    const dark = c.isDark();
    const fontColor = dark ? '#fff' : '#000';
    const key = getDomainKey(domain);
    if (!appData || !key) {
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