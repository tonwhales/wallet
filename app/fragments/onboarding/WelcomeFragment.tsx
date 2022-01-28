import * as React from 'react';
import { Platform, Pressable, Text, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useTranslation } from 'react-i18next';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useBootMounted } from '../../bootContext';

export const WelcomeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    useBootMounted();

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? safeArea.top : 0 }}>
            <AndroidToolbar />
            <View style={{
                height: 416,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <View style={{ width: 256, height: 256, marginBottom: 8, maxWidth: 140, maxHeight: 140, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={require('../../../assets/ic_diamond.png')} />
                </View>
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    textAlign: 'center',
                    marginTop: 26
                }}>
                    {t('Tonhub Wallet')}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    color: '#8E979D',
                    fontSize: 14,
                    marginTop: 14,
                    flexShrink: 1,
                }}>
                    {t('Easiest and secure TON wallet')}
                </Text>
            </View>
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