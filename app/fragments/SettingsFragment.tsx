import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const SettingsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ height: 55 }} />
            <ItemButton title="Backup keys" onPress={() => navigation.navigate('WalletBackup')} />
        </ScrollView>
    );
});