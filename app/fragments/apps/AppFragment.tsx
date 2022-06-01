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

export const AppFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const endpoint = 'https://tonwhales.com';
    const color = '#fff';
    const c = Color(color);
    const fontColor = c.isDark() ? c.lighten(0.9).toString() : c.darken(0.8).toString();
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
                    }, { textAlign: 'center' }]}>{t('auth.apps.title')}</Text>
                </View>
            )}

            <AppComponent endpoint={endpoint} color={color} foreground={fontColor} />

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