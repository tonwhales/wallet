import * as React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '../../Theme';
import { AppConfig } from '../../AppConfig';
import { isTermsAccepted } from '../../storage/appState';
import { t } from '../../i18n/t';

export const WelcomeFragment = fragment(() => {
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
        if (isTermsAccepted()) {
            navigation.navigate('WalletCreate');
        } else {
            navigation.navigate('LegalCreate');
        }
    }, []);

    return (
        <View style={{
            alignItems: 'center', justifyContent: 'center',
            flexGrow: 1,
            backgroundColor: 'white'
        }}>
            <StatusBar style='dark' />
            <View style={{
                height: 416,
                alignItems: 'center',
            }}>
                <View style={{
                    width: 256, height: 256,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <Image source={
                        AppConfig.isTestnet
                            ? require('../../../assets/ic_diamond_test.png')
                            : require('../../../assets/ic_diamond.png')}
                    />
                </View>
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    marginTop: -42,
                    textAlign: 'center',
                }}>
                    {AppConfig.isTestnet ? t('welcome.titleDev') : t('welcome.title')}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    color: '#8E979D',
                    fontSize: 14,
                    marginTop: 14,
                    flexShrink: 1,
                }}>
                    {AppConfig.isTestnet ? t('welcome.subtitleDev') : t('welcome.subtitle')}
                </Text>
            </View>
            <View style={{ height: 128, position: 'absolute', bottom: safeArea.bottom, left: 16, right: 16 }}>
                <RoundButton title={t('welcome.createWallet')} onPress={onCreatePressed} />
                <Pressable
                    onPress={onImportPressed}
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            alignSelf: 'center',
                            marginTop: 26
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '400',
                        color: Theme.accentText
                    }}>
                        {t('welcome.importWallet')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
});