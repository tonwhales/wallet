import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { ItemHeader } from '../components/ItemHeader';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const SettingsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ height: safeArea.top }} />
            <ItemHeader title="Settings" />
            <ItemButton title="Backup keys" onPress={() => navigation.navigate('WalletBackup')} />
        </ScrollView>
    );
});