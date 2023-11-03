import * as React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { isTermsAccepted } from '../../storage/terms';
import { ThemeStyle } from '../../engine/state/theme';

export const WelcomeFragment = systemFragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
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
            backgroundColor: theme.surfacePimary
        }}>
            <StatusBar style={theme.style === ThemeStyle.Dark ? 'light' : 'dark'} />
            <View style={{
                height: 416,
                alignItems: 'center',
            }}>
                <View style={{
                    width: 256, height: 256,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <Image source={
                        isTestnet
                            ? require('../../../assets/ic_diamond_test.png')
                            : require('../../../assets/ic_diamond.png')}
                    />
                </View>
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    marginTop: -42,
                    textAlign: 'center',
                    color: theme.textPrimary
                }}>
                    {isTestnet ? t('welcome.titleDev') : t('welcome.title')}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    fontSize: 18,
                    marginTop: 14,
                    flexShrink: 1,
                    color: theme.textPrimary
                }}>
                    {isTestnet ? t('welcome.subtitleDev') : t('welcome.subtitle')}
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
                            marginTop: 26,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: theme.accent
                    }}>
                        {t('welcome.importWallet')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
});