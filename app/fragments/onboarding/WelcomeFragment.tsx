import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useTheme } from '../../engine/hooks';
import { isTermsAccepted } from '../../storage/terms';
import { ThemeStyle } from '../../engine/state/theme';
import { useCallback } from 'react';
import { WelcomeSlider } from '../../components/slider/WelcomeSlider';

export const WelcomeFragment = systemFragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onImportPressed = useCallback(() => {
        if (isTermsAccepted()) {
            navigation.navigate('WalletImport');
        } else {
            navigation.navigate('LegalImport');
        }
    }, []);
    const onCreatePressed = useCallback(() => {
        if (isTermsAccepted()) {
            navigation.navigate('WalletCreate');
        } else {
            navigation.navigate('LegalCreate');
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
        }}>
            <StatusBar style={theme.style === ThemeStyle.Dark ? 'light' : 'dark'} />
            <WelcomeSlider style={{ paddingTop: safeArea.top }} />
            <View style={{
                width: '100%',
                justifyContent: 'space-between',
                padding: 16,
                marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom
            }}>
                <RoundButton
                    title={t('welcome.createWallet')}
                    onPress={onCreatePressed}
                    style={{ height: 56, marginBottom: 16 }}
                />
                <RoundButton
                    title={t('welcome.importWallet')}
                    onPress={onImportPressed}
                    style={{ height: 56 }}
                    display={'secondary'}
                />
            </View>
        </View>
    );
});