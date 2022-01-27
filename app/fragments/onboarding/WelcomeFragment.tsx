import * as React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
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
                    onPress={() => navigation.navigate('LegalImport')}
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
                        {t('Import existing wallet')}
                    </Text>
                </Pressable>
            ),
        })
    }, []);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? safeArea.top : 0 }}>
            <View style={{ alignItems: 'center', height: 416, marginTop: 116 }}>
                <View style={{ width: 140, height: 126 }}>
                    <Image
                        style={{ width: 140, height: 126 }}
                        source={require('../../../assets/ic_diamond.png')}
                    />
                </View>
                <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 30, height: 34, textAlign: 'center' }}>
                    {t('Tonhub Wallet')}
                </Text>
                <Text style={{ fontSize: 16, textAlign: 'center', marginHorizontal: 48, marginTop: 8, color: '#6D6D71' }}>
                    {t('Easiest and secure TON wallet')}
                </Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Create wallet")} onPress={() => navigation.navigate('LegalCreate')} />
            </View>
            {Platform.OS === 'android' && (
                <Pressable
                    onPress={() => navigation.navigate('LegalImport')}
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            position: 'absolute',
                            top: safeArea.top + 16, right: 16
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '400',
                        color: 'rgba(66, 163, 235, 1)'
                    }}>
                        {t('Import existing wallet')}
                    </Text>
                </Pressable>
            )}
        </View>
    );
});