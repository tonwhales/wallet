import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View, Text } from 'react-native';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { CloseButton } from '../../components/CloseButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { getMetaTags, MetaTags } from '../../utils/meta/getMetaTags';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../utils/extractDomain';
import { useEngine } from '../../engine/Engine';

export const AppFragment = fragment(() => {
    const engine = useEngine();
    const url = (useRoute().params as any).url;
    const domain = extractDomain(url);
    const appData = engine.products.dApps.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const color = appData && appData.color ? appData.color : '#fff';
    const c = Color(color);
    const fontColor = c.isDark() ? c.lighten(0.9).hex() : c.darken(0.8).hex();
    const key = engine.persistence.domainKeys.getValue(domain);
    if (!appData || !key) {
        throw Error('Impossible');
    }

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: color
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17,
                        color: fontColor
                    }, { textAlign: 'center' }]}>{appData.title}</Text>
                </View>
            )}

            <AppComponent
                endpoint={url}
                color={color}
                foreground={fontColor}
                title={appData.title}
                domainKey={key}
            />

            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});