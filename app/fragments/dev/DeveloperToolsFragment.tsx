import * as React from 'react';
import { Alert, Platform, ToastAndroid, View, Text } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { clearZenPay } from '../LogoutFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import * as Application from 'expo-application';
import { warn } from '../../utils/log';
import { RoundButton } from '../../components/RoundButton';
import { ATextInput } from '../../components/ATextInput';
import { t } from '../../i18n/t';
import { WalletKeys, loadWalletKeys } from '../../storage/walletKeys';
import { getCurrentAddress } from '../../storage/appState';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';

export const DeveloperToolsFragment = fragment(() => {
    const { Theme, AppConfig, setNetwork } = useAppConfig();
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    
    const reboot = useReboot();
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        clearZenPay(engine);
        reboot();
    }, []);

    const switchNetwork = React.useCallback(
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

    const [zenPayAppUrl, setZenPayAppUrl] = React.useState(storage.getString('zenpay-app-url') ?? 'https://next.zenpay.org');

    const onUrlSet = React.useCallback((link: string) => {
        let url: URL
        try {
            url = new URL(link);
            setZenPayAppUrl(url.toString());
        } catch (e) {
            warn(e)
            setZenPayAppUrl('');
        }
    }, []);

    const copySeed = React.useCallback(async () => {
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
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

    const onExportSeedAlert = React.useCallback(() => {
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
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>
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
                        <ItemButton leftIcon={require('../../../assets/ic_backup.png')} title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
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

                    {AppConfig.isTestnet && (
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ATextInput
                                blurOnSubmit={false}
                                value={zenPayAppUrl}
                                onValueChange={onUrlSet}
                                placeholder={'ZenPay App URL'}
                                keyboardType={'default'}
                                preventDefaultHeight
                                editable={true}
                                enabled={true}
                                label={
                                    <View style={{
                                        flexDirection: 'row',
                                        width: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        overflow: 'hidden',
                                    }}>
                                        <Text style={{
                                            fontWeight: '500',
                                            fontSize: 12,
                                            color: Theme.label,
                                            alignSelf: 'flex-start',
                                        }}>
                                            {'ZenPay App URL'}
                                        </Text>
                                    </View>
                                }
                                multiline
                                autoCorrect={false}
                                autoComplete={'off'}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0,
                                    minHeight: 72,
                                    marginHorizontal: 16,
                                }}
                            />
                            <RoundButton
                                title={'Apply URL'}
                                onPress={() => {
                                    storage.set('zenpay-app-url', zenPayAppUrl);
                                    Alert.alert('Success', 'ZenPay App URL has been updated, now restart the app to apply changes.');
                                }}
                                display={'default'}
                                style={{ flexGrow: 1, marginHorizontal: 16, marginBottom: 16 }}
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
});