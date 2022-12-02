import * as React from 'react';
import { Platform, View, Text } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { ATextInput } from '../../components/ATextInput';
import { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { RoundButton } from '../../components/RoundButton';
import { t } from '../../i18n/t';
import { getAppState, getCurrentAddress, markAddressSecured, setAppState } from '../../storage/appState';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';

export const DeveloperToolsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const storedWalletId = storagePersistence.getNumber('wallet-v4-wallet-id');
    const [walletId, setWalletId] = useState(storedWalletId?.toString());
    const reboot = useReboot();
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        reboot();
    }, []);

    const engine = useEngine();
    const counter = React.useMemo(() => engine.cloud.counter('counter.sample'), []);
    const counterValue = counter.use().counter;

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
            <ScrollView>
                <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
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
                    </View>
                    <View style={{
                        marginTop: 4,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingVertical: 8,
                    }}>
                        <ATextInput
                            index={0}
                            value={walletId}
                            onValueChange={setWalletId}
                            placeholder={'698983191'}
                            keyboardType={'number-pad'}
                            preventDefaultHeight
                            preventDefaultLineHeight
                            preventDefaultValuePadding
                            blurOnSubmit={false}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginHorizontal: 16
                            }}
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
                                        color: '#7D858A',
                                        alignSelf: 'flex-start',
                                    }}>
                                        {'Wallet ID'}
                                    </Text>
                                </View>
                            }
                        />
                        <RoundButton
                            style={{
                                marginHorizontal: 16,
                                marginTop: 16
                            }}
                            title={t('common.apply') + ' wallet_id'}
                            onPress={async () => {
                                try {
                                    let id = undefined;
                                    if (walletId && walletId.length > 0) {
                                        id = parseInt(walletId);
                                    }
                                    const acc = getCurrentAddress();
                                    if (id) {
                                        storagePersistence.set('wallet-v4-wallet-id', id);
                                    } else {
                                        storagePersistence.delete('wallet-v4-wallet-id');
                                    }
                                    const contract = await contractFromPublicKey(acc.publicKey, id);

                                    // Persist state
                                    const state = getAppState();
                                    setAppState({
                                        addresses: [
                                            ...state.addresses,
                                            {
                                                address: contract.address,
                                                publicKey: acc.publicKey,
                                                secretKeyEnc: acc.secretKeyEnc,
                                                utilityKey: acc.utilityKey,
                                            }
                                        ],
                                        selected: state.addresses.length
                                    });

                                    // Persist secured flag
                                    markAddressSecured(contract.address);

                                    reboot();
                                } catch (error) {
                                    console.warn('Failed to set wallet id', error);
                                }
                            }}
                            display={'default'}
                        />
                    </View>
                    <View style={{ height: 400 }} />
                </View>
            </ScrollView>
        </View>
    );
});