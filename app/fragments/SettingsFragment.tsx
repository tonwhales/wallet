import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View, Text, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { ItemHeader } from '../components/ItemHeader';
import { fragment } from '../fragment';
import { Theme } from '../Theme';
import { storage } from '../storage/storage';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { BlurView } from 'expo-blur';
import { useReboot } from '../Root';

export const SettingsFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const reboot = useReboot();

    const doSignout = React.useCallback(() => {
        Alert.alert(t('Are you sure want to log out?'), '', [{
            text: t('Log out'), style: 'destructive', onPress: () => {
                storage.clearAll();
                reboot();
            }
        }, { text: t('Cancel') }])
    }, []);

    return (
        <View style={{
            flexGrow: 1,
        }}>
            {Platform.OS === 'ios' && (
                <BlurView style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[
                            { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                        ]}>
                            {t("Settings")}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </BlurView>
            )}
            {Platform.OS === 'android' && (
                <View style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[
                            { fontSize: 22, color: Theme.textColor, fontWeight: '700' },
                        ]}>
                            {t("Settings")}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </View>
            )}
            <ScrollView
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    paddingHorizontal: 16,
                }}
            >
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
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
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
                        <ItemButton leftIcon={require('../../assets/ic_terms.png')} title={t("Terms of Service")} onPress={() => navigation.navigate('Terms')} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
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
                        <ItemButton leftIcon={require('../../assets/ic_terms.png')} title={t("Developer Tools")} onPress={() => navigation.navigate('DeveloperTools')} />
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
        </View>
    );
});