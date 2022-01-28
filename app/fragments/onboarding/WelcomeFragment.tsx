import * as React from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/AppLogo';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { Theme } from '../../Theme';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { AndroidToolbar } from '../../components/AndroidToolbar';

export const WelcomeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? safeArea.top : 0 }}>
            <AndroidToolbar />
            <FragmentMediaContent
                image={require('../../../assets/ic_diamond.png')}
                title={t('Tonhub Wallet')}
                text={t('Easiest and secure TON wallet')}
            />
            <View style={{ flex: 1 }} />
            <View style={{ height: 128, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Create wallet")} onPress={() => navigation.navigate('LegalCreate')} />
                <Pressable
                    onPress={() => navigation.navigate('LegalImport')}
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
                        color: 'rgba(66, 163, 235, 1)'
                    }}>
                        {t('Import existing wallet')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
});