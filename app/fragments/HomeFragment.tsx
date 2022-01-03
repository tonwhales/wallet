import * as React from 'react';
import { Pressable, View } from 'react-native';
import { fragment } from "../fragment";
import { Theme } from '../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WalletFragment } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { StatusBar } from 'expo-status-bar';

export const HomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const [tab, setTab] = React.useState(0);
    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{ flexGrow: 1 }} />
            <StatusBar style={tab === 0 ? 'light' : 'dark'} />
            <View style={{ paddingBottom: safeArea.bottom, height: 52 + safeArea.bottom, backgroundColor: Theme.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Pressable style={{ height: 52, width: 86, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(0)}>
                    <Ionicons name="wallet" size={32} color={tab === 0 ? Theme.accent : Theme.textSecondary} />
                </Pressable>
                <Pressable style={{ height: 52, width: 86, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(1)}>
                    <Ionicons name="cog" size={32} color={tab === 1 ? Theme.accent : Theme.textSecondary} />
                </Pressable>
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: safeArea.bottom + 52, opacity: tab === 0 ? 1 : 0 }} pointerEvents={tab === 0 ? 'box-none' : 'none'}>
                <WalletFragment />
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: safeArea.bottom + 52, opacity: tab === 1 ? 1 : 0 }} pointerEvents={tab === 1 ? 'box-none' : 'none'}>
                <SettingsFragment />
            </View>
        </View>
    );
});