import * as React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { isTermsAccepted } from '../../storage/appState';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useDimensions } from '@react-native-community/hooks';
import { WelcomeSlider } from '../../components/slider/WelcomeSlider';

export const WelcomeFragment = systemFragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const onImportPressed = React.useCallback(() => {
        if (isTermsAccepted()) {
            navigation.navigate('WalletImport');
        } else {
            navigation.navigate('LegalImport');
        }
    }, []);
    const onCreatePressed = React.useCallback(() => {
        navigation.navigate('LegalCreate');
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: Theme.item,
        }}>
            <StatusBar style='dark' />
            <WelcomeSlider style={{ paddingTop: safeArea.top }} />
            <View style={{
                height: 160, width: '100%',
                justifyContent: 'space-between',
                padding: 16,
                marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom
            }}>
                <RoundButton
                    title={t('welcome.createWallet')}
                    onPress={onCreatePressed}
                    style={{ height: 56 }}
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