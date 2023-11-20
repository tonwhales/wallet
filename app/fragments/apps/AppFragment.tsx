import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useAppData, useTheme } from '../../engine/hooks';
import { getDomainKey } from '../../engine/state/domainKeys';
import { StatusBar } from 'expo-status-bar';

export const AppFragment = fragment(() => {
    const theme = useTheme();
    const url = (useRoute().params as any).url as string;
    const domain = extractDomain(url);
    const appData = useAppData(url);
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
            backgroundColor: color
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
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