import * as React from 'react';
import { Alert, Platform, View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { clearZenPay } from '../LogoutFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import * as Application from 'expo-application';
import { ScrollView } from 'react-native-gesture-handler';
import { useAppStateManager } from '../../engine/AppStateManager';

export const DeveloperToolsFragment = fragment(() => {
    const appStateManager = useAppStateManager();
    const addresses = appStateManager.current.addresses.map((a) => a.address);
    const { Theme, AppConfig, setNetwork } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        clearZenPay(engine);
        reboot();
    }, []);

    const engine = useEngine();

    const switchNetwork = React.useCallback(
        () => {
            Alert.alert(
                `Switching to ${AppConfig.isTestnet ? 'Mainnet' : 'Testnet'}`,
                'Are you sure you want to switch networks?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Switch',
                        onPress: () => setNetwork(!AppConfig.isTestnet),
                    }
                ]
            );
        },
        [AppConfig.isTestnet],
    );

    const onAddNewAccount = React.useCallback(() => {
        navigation.navigate('WalletImport', { newAccount: true });
    }, []);

    const onSwitchAccount = React.useCallback((selected: number) => {
        if (
            selected !== -1
            && selected < appStateManager.current.addresses.length
            && selected !== appStateManager.current.selected
        ) {
            appStateManager.updateAppState({
                ...appStateManager.current,
                selected
            });
        }
    }, [appStateManager.current]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={'dark'} />
            <AndroidToolbar pageTitle={'Dev Tools'} />
            <ScrollView style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>
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
                                <ItemButton title={"Network"} onPress={switchNetwork} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                            </View>
                        )}
                </View>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <ItemButton title={"Add new account"} onPress={onAddNewAccount} />
                    {addresses.map((address, index) => {
                        return (
                            <ItemButton
                                key={`addr-${index}`}
                                title={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                hint={`Address #${index + 1}`}
                                onPress={() => onSwitchAccount(index)}
                            />
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    );
});