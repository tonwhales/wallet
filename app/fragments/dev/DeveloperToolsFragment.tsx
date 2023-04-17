import * as React from 'react';
import { Alert, Platform, View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { Cell, CommentMessage } from 'ton';
import { clearZenPay } from '../LogoutFragment';

export const DeveloperToolsFragment = fragment(() => {
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
    const counter = React.useMemo(() => engine.cloud.counter('counter.sample'), []);
    const counterValue = counter.use().counter;
    const status = engine.products.zenPay.useStatus();

    // const isTestNet = useTestnet();
    // const switchNetwork = React.useCallback(() => {
    //     let state = (getAppState())!;
    //     setAppState({ ...state, testnet: !state.testnet });
    //     reboot();
    // }, []);
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
                        <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Test Whales"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://sandbox.tonwhales.com/tools/x' : 'https://tonwhales.com/tools/x' })} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Test Scaleton"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://sandbox.scaleton.io' : 'https://scaleton.io' })} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Test Gems"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://getgems.io' : 'https://getgems.io' })} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title={"Cloud Counter"} hint={counterValue.toString()} onPress={() => counter.update((src) => src.counter.increment())} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Version"} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item
                            title={"AccountStatus"}
                            hint={JSON.stringify(status.state)}
                            onPress={() => {
                                (async () => {
                                    try {
                                        console.log('here1');
                                        clearZenPay(engine);
                                        engine.persistence.zenPayStatus.item(engine.address).update((src) => null);
                                        console.log('here2');
                                        console.log('here3');


                                        const data = await engine.products.extensions.getAppData(zenPayUrl);
                                        if (!data) {
                                            Alert.alert(t('auth.failed'));
                                            return;
                                        }
                                        console.log('here4');

                                        const domain = extractDomain(zenPayUrl);
                                        console.log('here5');
                                        const res = await engine.products.zenPay.enroll(domain);
                                        if (!res) {
                                            Alert.alert(t('auth.failed'));
                                            return;
                                        }
                                        console.log('here6', { res });

                                    } catch (error) {
                                        Alert.alert(t('auth.failed'));
                                        warn(error);
                                    }
                                })();
                            }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
});