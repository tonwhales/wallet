import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View, Text } from 'react-native';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '../../components/CloseButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useEngine } from '../../engine/Engine';
import { RoundButton } from '../../components/RoundButton';
import { t } from '../../i18n/t';

export const AppFragment = fragment(() => {
    const engine = useEngine();
    const url = (useRoute().params as any).url;
    const domain = extractDomain(url);
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const color = appData && appData.color ? appData.color : '#fff';
    const c = Color(color);
    const dark = c.isDark();
    const fontColor = dark ? '#fff' : '#000';
    const key = engine.persistence.domainKeys.getValue(domain);
    if (!appData) {
        throw Error('No App Data');
    }
    if (!key) {
        throw Error('No Domain Key');
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

            <View style={{ height: 50 + safeArea.bottom, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom }}>
                <RoundButton title={t('common.close')} display="secondary" size="normal" style={{ paddingHorizontal: 8 }} onPress={() => navigation.goBack()} />
            </View>
        </View>
    );
});