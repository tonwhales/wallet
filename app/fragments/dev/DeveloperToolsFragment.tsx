import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence, storageQuery } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import * as Application from 'expo-application';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useMemo, useState } from 'react';
import { useOfflineApp } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useSetNetwork } from '../../engine/hooks';
import { useCloudValue } from '../../engine/hooks';
import { ThemeStyle } from '../../engine/state/theme';
import { useThemeStyle } from '../../engine/hooks';
import { useLanguage } from '../../engine/hooks';
import i18n from 'i18next';
import { onAccountTouched } from '../../engine/effects/onAccountTouched';
import { getCurrentAddress } from '../../storage/appState';
import { useClearHolders } from '../../engine/hooks';
import { useHoldersAccounts } from '../../engine/hooks';
import { useHoldersAccountStatus } from '../../engine/hooks';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { queryClient } from '../../engine/clients';

export const DeveloperToolsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const setNetwork = useSetNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const offlineApp = useOfflineApp();

    const acc = useMemo(() => getCurrentAddress(), []);

    const cards = useHoldersAccounts(acc.address);
    const holdersStatus = useHoldersAccountStatus(acc.address);

    const [counter, setCounter] = useCloudValue<{ counter: number }>('counter', (t) => t.counter = 0);

    const [offlineAppReady, setOfflineAppReady] = useState<{ version: string } | false>();
    const [prevOfflineVersion, setPrevOfflineVersion] = useState<{ version: string } | false>();

    const [themeStyle, setThemeStyle] = useThemeStyle();
    const [lang, setLang] = useLanguage();

    const reboot = useReboot();
    const clearHolders = useClearHolders();

    const resetCache = useCallback(async () => {
        queryClient.clear();
        queryClient.invalidateQueries();
        storagePersistence.clearAll();
        storageQuery.clearAll();
        await clearHolders(acc.address.toString({ testOnly: isTestnet }));
        await onAccountTouched(acc.address.toString({ testOnly: isTestnet }), isTestnet);
        reboot();
    }, [isTestnet, clearHolders]);

    const switchNetwork = useCallback(() => {
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
            walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
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
        <View style={{ flexGrow: 1, paddingTop: 32 }}>
            <ScreenHeader style={{ paddingHorizontal: 16 }} onBackPressed={navigation.goBack} title={'Dev Tools'} />
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    flexGrow: 1,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{
                        flexGrow: 1, flexBasis: 0,
                        paddingHorizontal: 16, marginTop: 0
                    }}
                    contentInset={{
                        bottom: safeArea.bottom + 44,
                    }}
                >
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
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
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.holdersOfflineApp')} hint={offlineApp.version ? offlineApp.version : 'Not loaded'} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={'Offline integrity:'} hint={offlineAppReady ? 'Ready' : 'Not ready'} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.holdersOfflineApp') + ' (Prev.)'} hint={prevOfflineVersion ? `Ready: ${prevOfflineVersion.version}` : 'Not ready'} />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Theme'}
                                hint={themeStyle}
                                onPress={() => {
                                    if (theme.style === ThemeStyle.Light) {
                                        setThemeStyle(ThemeStyle.Dark);
                                        return;
                                    }

                                    setThemeStyle(ThemeStyle.Light);
                                    return;
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Language'}
                                hint={i18n.language}
                                onPress={async () => {
                                    if (i18n.language === 'en') {
                                        await i18n.changeLanguage('ru');
                                        setLang('ru');
                                    } else {
                                        await i18n.changeLanguage('en');
                                        setLang('en');
                                    }
                                    setTimeout(() => reboot(), 100);
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch cards'}
                                onPress={() => {
                                    cards.refetch();
                                }}
                            />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch status'}
                                hint={holdersStatus.data?.state}
                                onPress={() => {
                                    holdersStatus.refetch();
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        marginTop: 16,
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Dev WebView'}
                                onPress={() => {
                                    navigation.navigate('DevDAppWebView');
                                }}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});