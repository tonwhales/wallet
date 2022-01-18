import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { ItemHeader } from '../components/ItemHeader';
import { fragment } from '../fragment';
import { Theme } from '../Theme';
import { storage } from '../storage/storage';
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
        <ScrollView style={{ flexGrow: 1, backgroundColor: Theme.background, paddingHorizontal: 16 }}>
            <View style={{ height: safeArea.top }} />
            <ItemHeader title={t("Settings")} />
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../assets/ic_backup.png')} title={t("Backup keys")} onPress={() => navigation.navigate('WalletBackup')} />
                </View>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../assets/ic_import.png')} title={t("Migrate old wallets")} onPress={() => navigation.navigate('Migration')} />
                </View>
            </View>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../assets/ic_terms.png')} title={t("Terms of service")} onPress={() => navigation.navigate('Terms')} />
                </View>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../assets/ic_privacy.png')} title={t("Privacy policy")} onPress={() => navigation.navigate('Privacy')} />
                </View>
            </View>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../assets/ic_sign_out.png')} dangerZone title={t("Sign out")} onPress={doSignout} />
                </View>
            </View>
        </ScrollView>
    );
});