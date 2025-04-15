import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useNetwork, useTheme } from '../../engine/hooks';
import { isTermsAccepted } from '../../storage/terms';
import { useCallback } from 'react';
import { WelcomeSlider } from '../../components/slider/WelcomeSlider';
import { ScrollView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';

export const WelcomeFragment = systemFragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();

    const onImportPressed = useCallback(() => {
        navigation.navigate('WalletImportSelector');
    }, []);

    const onCreatePressed = () => {
        trackEvent(MixpanelEvent.WalletCreate, undefined, isTestnet, true);
        navigation.navigate('LegalCreate');
    };

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
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