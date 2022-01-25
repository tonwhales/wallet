import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/AppLogo';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { Theme } from '../../Theme';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

export const WelcomeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ref = React.useRef<LottieView>(null);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => navigation.navigate('WalletImport')}
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '400',
                        color: 'rgba(66, 163, 235, 1)'
                    }}>
                        {'Import existing wallet'}
                    </Text>
                </Pressable>
            ),
        })
    }, []);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff' }}>
            <View style={{ alignItems: 'center', height: 416, marginTop: 22 + 8 + 34 + 8 }}>
                <View style={{ width: 140, height: 126, marginTop: -14 }}>
                    <Image
                        style={{ width: 140, height: 126 }}
                        source={require('../../../assets/ic_diamond.png')}
                    />
                </View>
                <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 30, height: 34, textAlign: 'center' }}>
                    {t('Tonhub Wallet')}
                </Text>
                <Text style={{ fontSize: 18, color: Theme.textColor, textAlign: 'center', marginHorizontal: 16, marginTop: 8, height: 22 }}>
                    {t('Easiest and secure TON wallet')}
                </Text>
            </View>
            <View style={{ height: 128 + safeArea.bottom + 16, position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 16, justifyContent: 'center' }}>
                <RoundButton title={t("Create wallet")} onPress={() => navigation.navigate('WalletCreate')} />
                <Text style={{
                    textAlign: 'center',
                    color: '#8E979D',
                    fontSize: 14,
                    marginTop: 14,
                    marginHorizontal: 35
                }}>
                    {'By creating a wallet you agree to the Tonhub '}
                    <Text style={{ color: '#1C8FE3' }} onPress={() => navigation.navigate('Terms')}>{'Terms of Service'}</Text>
                    {' and '}
                    <Text style={{ color: '#1C8FE3' }} onPress={() => navigation.navigate('Privacy')}>{'Privacy policy'}</Text>
                </Text>
            </View>
        </View>
    );
});