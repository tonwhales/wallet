import * as React from 'react';
import { Alert, View, Text, Platform, Pressable, ActionSheetIOS } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { Theme } from '../Theme';
import { storage } from '../storage/storage';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { BlurView } from 'expo-blur';
import { useReboot } from '../utils/RebootContext';
import { AppConfig } from '../AppConfig';
import { t } from '../i18n/t';
import { ProfileComponent } from './profile/ProfileComponent';
import { useEngine } from '../engine/Engine';
import BN from 'bn.js';

export const SettingsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();

    const onVersionTap = React.useMemo(() => {
        let count = 0;
        let timer: any | null = null;
        return () => {
            count++;
            if (count > 5) {
                count = 0;
                navigation.navigate('DeveloperTools')
            } else {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    timer = null;
                    count = 0;
                }, 1000);
            }
        };
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
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
                            {t('settings.title')}
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
                            {t('settings.title')}
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
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    paddingHorizontal: 16,
                    flexBasis: 0,
                    marginBottom: 52 + safeArea.bottom
                }}
            >
                {__DEV__ && (
                    <ProfileComponent address={engine.address} />
                )}
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_backup.png')} title={t('settings.backupKeys')} onPress={() => navigation.navigate('WalletBackup', { back: true })} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                    {oldWalletsBalance.gt(new BN(0)) && (
                        <>
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton leftIcon={require('../../assets/ic_wallet_2.png')} title={t('settings.migrateOldWallets')} onPress={() => navigation.navigate('Migration')} />
                            </View>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                        </>
                    )}
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_accounts.png')} title={t('products.accounts')} onPress={() => navigation.navigate('Accounts')} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_filter.png')} title={t('settings.spamFilter')} onPress={() => navigation.navigate('SpamFilter')} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_contacts.png')} title={t('contacts.title')} onPress={() => navigation.navigate('Contacts')} />
                    </View>
                </View>

                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_ton_symbol.png')} title={t('settings.primaryCurrency')} onPress={() => navigation.navigate('Currency')} />
                    </View>
                </View>
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_import.png')} title={t('auth.name')} onPress={() => navigation.navigate('Connections')} />
                    </View>
                </View>

                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_terms.png')} title={t('settings.termsOfService')} onPress={() => navigation.navigate('Terms')} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_privacy.png')} title={t('settings.privacyPolicy')} onPress={() => navigation.navigate('Privacy')} />
                    </View>
                </View>

                {__DEV__ && (
                    <View style={{
                        marginBottom: 16, marginTop: 16,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title='Dev Tools' onPress={() => navigation.navigate('DeveloperTools')} />
                        </View>
                    </View>
                )}
                <View style={{
                    marginBottom: 4, marginTop: 8,
                    backgroundColor: 'white',
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_sign_out.png')} dangerZone title={t('common.logout')} onPress={() => navigation.navigate('Logout')} />
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../assets/ic_delete.png')} dangerZone title={t('deleteAccount.title')} onPress={() => navigation.navigate('DeleteAccount')} />
                    </View>
                </View>
                <View style={{ height: 52 + 8 + safeArea.bottom }} />
            </ScrollView>
            <Pressable
                onPress={onVersionTap}
                style={{
                    position: 'absolute',
                    bottom: 52 + 14 + safeArea.bottom,
                    flexShrink: 1,
                    alignSelf: 'center',
                    borderRadius: 20,
                    overflow: 'hidden',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                }}
            >
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: Theme.background,
                    opacity: 0.8
                }} />

                <Text style={{
                    color: Theme.textSecondary,
                    alignSelf: 'center',
                }}>
                    Tonhub v{AppConfig.version}
                </Text>
            </Pressable>
        </View>
    );
}, true);