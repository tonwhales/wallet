import * as React from 'react';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { ItemHeader } from '../components/ItemHeader';
import { fragment } from '../fragment';
import { storage } from '../utils/storage';
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const SettingsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const doSignout = React.useCallback(() => {
        Alert.alert('Are your sure want to signout?', '', [{
            text: 'Log out', style: 'destructive', onPress: () => {
                storage.clearAll();
                navigation.navigateAndReplaceAll('Welcome');
            }
        }, { text: 'Cancel' }])
    }, []);
    return (
        <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ height: safeArea.top }} />
            <ItemHeader title="Settings" />
            <ItemButton title="Backup keys" onPress={() => navigation.navigate('WalletBackup')} />
            <ItemButton title="Migrate old wallets" onPress={() => navigation.navigate('Migration')} />
            <ItemButton title="Sign out" onPress={doSignout} />
        </ScrollView>
    );
});