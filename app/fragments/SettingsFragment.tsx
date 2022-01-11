import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { ItemHeader } from '../components/ItemHeader';
import { fragment } from '../fragment';
import { storage } from '../utils/storage';
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const SettingsFragment = fragment(() => {
    const { t } = useTranslation();
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
            <ItemHeader title={t("Settings")} />
            <ItemButton title={t("Backup keys")} onPress={() => navigation.navigate('WalletBackup')} />
            <ItemButton title={t("Migrate old wallets")} onPress={() => navigation.navigate('Migration')} />
            <ItemButton dangerZone title={t("Sign out")} onPress={doSignout} />
        </ScrollView>
    );
});