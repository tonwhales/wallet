import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View, Text } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import * as Application from 'expo-application';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { clearHolders } from '../LogoutFragment';
import { useCallback, useEffect, useState } from 'react';
import { useOfflineApp } from '../../engine/hooks/useOfflineApp';
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { useSetNetwork } from '../../engine/effects/useSetNetwork';
import { useCloudValue } from '../../engine/hooks/basic/useCloudValue';

export const DeveloperToolsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const setNetwork = useSetNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const offlineApp = useOfflineApp();
    const [counter, setCounter] = useCloudValue<{ counter: number }>('counter', (t) => t.counter = 0);

    const [offlineAppReady, setOfflineAppReady] = useState<{ version: string } | false>();
    const [prevOfflineVersion, setPrevOfflineVersion] = useState<{ version: string } | false>();

    // useEffect(() => {
    //     (async () => {
    //         const ready = await checkCurrentOfflineVersion();
    //         setOfflineAppReady(ready ? { version: ready } : false);
    //         const prev = await engine.products.holders.getPrevOfflineVersion();
    //         if (prev) {
    //             const prevReady = await engine.products.holders.isOfflineAppReady(prev);
    //             setPrevOfflineVersion(prevReady ? prev : false);
    //         }
    //     })()
    // }, [offlineApp]);

    const reboot = useReboot();
    const resetCache = useCallback(() => {
        storagePersistence.clearAll();
        // clearHolders(engine);
        reboot();
    }, []);

    const switchNetwork = useCallback(() => {
        console.log({ isTestnet });
        Alert.alert(
            t('devTools.switchNetworkAlertTitle', { network: isTestnet ? 'Mainnet' : 'Testnet' }),
            t('devTools.switchNetworkAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.switchNetworkAlertAction'),
                    onPress: () => setNetwork(isTestnet ? 'mainnet' : 'testnet'),
                }
            ]
        );
    }, [isTestnet]);

    const copySeed = useCallback(async () => {
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ backgroundColor: theme.item });
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
            <ScrollView style={{ backgroundColor: theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>


                <View style={{
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: theme.item,
                    borderRadius: 14,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../../assets/ic_backup.png')} title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Counter"} hint={counter.counter.toString()} onPress={() => setCounter((value) => value.counter++)} />
                    </View>

                    {!(
                        Application.applicationId === 'com.tonhub.app.testnet' ||
                        Application.applicationId === 'com.tonhub.app.debug.testnet' ||
                        Application.applicationId === 'com.tonhub.wallet.testnet' ||
                        Application.applicationId === 'com.tonhub.wallet.testnet.debug'
                    ) && (
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton title={t('devTools.switchNetwork')} onPress={switchNetwork} hint={isTestnet ? 'Testnet' : 'Mainnet'} />
                            </View>
                        )}
                </View>
                <View style={{
                    marginTop: 16,
                    backgroundColor: theme.item,
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
                        <ItemButton title={'Offline integrity:'} hint={offlineAppReady ? 'Ready' : 'Not ready'} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={t('devTools.holdersOfflineApp') + ' (Prev.)'} hint={prevOfflineVersion ? `Ready: ${prevOfflineVersion.version}` : 'Not ready'} />
                    </View>

                    {/* <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={'Resync Offline App'} dangerZone onPress={async () => {
                            const app = engine.persistence.holdersOfflineApp.item().value;
                            if (app) {
                                engine.products.holders.cleanupPrevOfflineRes(app);
                            }
                            engine.persistence.holdersOfflineApp.item().update(() => null);
                            await engine.products.holders.forceSyncOfflineApp();
                        }} />
                    </View> */}
                </View>
            </ScrollView>
        </View>
    );
});