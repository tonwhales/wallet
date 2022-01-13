import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { fragment } from "../fragment";
import { Theme } from '../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WalletFragment } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

export const HomeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const [tab, setTab] = React.useState(0);
    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{ flexGrow: 1 }} />
            <StatusBar style={'dark'} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: tab === 0 ? 1 : 0 }} pointerEvents={tab === 0 ? 'box-none' : 'none'}>
                <WalletFragment />
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: tab === 1 ? 1 : 0 }} pointerEvents={tab === 1 ? 'box-none' : 'none'}>
                <SettingsFragment />
            </View>
            <View style={{ paddingBottom: safeArea.bottom, height: 52 + safeArea.bottom, paddingHorizontal: 16, backgroundColor: Theme.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(0)}>
                    <Image source={tab === 0 ? require('../../assets/ic_wallet_selected.png') : require('../../assets/ic_wallet.png')} />
                    <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 0 ? Theme.accent : Theme.textSecondary }}>{t('Wallet')}</Text>
                </Pressable>
                <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(1)}>
                    <Image source={tab === 1 ? require('../../assets/ic_settings_selected.png') : require('../../assets/ic_settings.png')} />
                    <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 1 ? Theme.accent : Theme.textSecondary }}>{t('Settings')}</Text>
                </Pressable>
            </View>
        </View>
    );
});