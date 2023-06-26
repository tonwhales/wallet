import * as React from 'react';
import { Alert, Platform, ToastAndroid, View, Text, KeyboardAvoidingView } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { clearHolders } from '../LogoutFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import * as Application from 'expo-application';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import { RoundButton } from '../../components/RoundButton';
import { ATextInput } from '../../components/ATextInput';
import { ScrollView } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { ItemSwitch } from '../../components/Item';

export const DeveloperToolsFragment = fragment(() => {
    const { Theme, AppConfig, setNetwork } = useAppConfig();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const offlineApp = engine.products.holders.useOfflineApp();

    const [offlineAppReady, setOfflineAppReady] = useState(false);
    const [offlineAppEnabled, setOfflineAppEnabled] = useState(storage.getBoolean('dev-tools:use-offline-app') ?? false);

    useEffect(() => {
        (async () => {
            if (!offlineApp) {
                setOfflineAppReady(false);
                return;
            }

            const filesCheck: Promise<boolean>[] = [];
            offlineApp.resources.forEach((asset) => {
                filesCheck.push((async () => {
                    const info = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}holders/${asset}`);
                    return info.exists;
                })());
            });

            filesCheck.push((async () => {
                const info = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}holders/index.html`);
                return info.exists;
            })());

            const files = await Promise.all(filesCheck);

            setOfflineAppReady(files.every((file) => file));
        })()
    }, [offlineApp]);

    const reboot = useReboot();
    const restart = useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = useCallback(() => {
        storagePersistence.clearAll();
        clearHolders(engine);
        reboot();
    }, []);

    const switchNetwork = useCallback(
        () => {
            Alert.alert(
                t('devTools.switchNetworkAlertTitle', { network: AppConfig.isTestnet ? 'Mainnet' : 'Testnet' }),
                t('devTools.switchNetworkAlertMessage'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                    },
                    {
                        text: t('devTools.switchNetworkAlertAction'),
                        onPress: () => setNetwork(!AppConfig.isTestnet),
                    }
                ]
            );
        },
        [AppConfig.isTestnet],
    );

    const copySeed = useCallback(async () => {
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ backgroundColor: Theme.item });
            const body = walletKeys.mnemonics.join(' ');

            if (Platform.OS === 'android') {
                Clipboard.setString(body);
                ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
                return;
            }
            Clipboard.setString(body);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            warn('Failed to load wallet keys');
            Alert.alert(t('common.error'), t('errors.unknown'));
            return;
        }
    }, [])

    const onExportSeedAlert = useCallback(() => {
        Alert.alert(
            t('devTools.copySeedAlertTitle'),
            t('devTools.copySeedAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.copySeedAlertAction'),
                    onPress: copySeed,
                }
            ]
        )
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={'dark'} />
            <AndroidToolbar pageTitle={'Dev Tools'} />
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    flexGrow: 1,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >


                <ScrollView style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
                        </View>
                        {!(
                            Application.applicationId === 'com.tonhub.app.testnet' ||
                            Application.applicationId === 'com.tonhub.app.debug.testnet' ||
                            Application.applicationId === 'com.tonhub.wallet.testnet' ||
                            Application.applicationId === 'com.tonhub.wallet.testnet.debug'
                        ) && (
                                <View style={{ marginHorizontal: 16, width: '100%' }}>
                                    <ItemButton title={t('devTools.switchNetwork')} onPress={switchNetwork} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                                </View>
                            )}

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Storage status screen"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.holdersOfflineApp')} hint={offlineApp ? offlineApp.version : 'Not loaded'} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={'Offline integrity check:'} hint={offlineAppReady ? 'Ready' : 'Not ready'} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={'Resync Offline App'} dangerZone onPress={async () => {
                                engine.persistence.holdersOfflineApp.item().update(() => null);
                                await engine.products.holders.forceSyncOfflineApp();
                            }} />
                        </View>
                    </View>
                    {AppConfig.isTestnet && (
                        <View style={{
                            marginBottom: 16, marginTop: 17,
                            backgroundColor: Theme.item,
                            borderRadius: 14,
                            overflow: 'hidden',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 1,
                        }}>
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemSwitch
                                    title='Use offline app'
                                    value={offlineAppEnabled}
                                    onChange={(newValue: boolean) => {
                                        storage.set('dev-tools:use-offline-app', newValue);
                                        setOfflineAppEnabled(newValue);
                                    }}
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});