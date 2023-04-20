import * as React from 'react';
import { Alert, Platform, View, Text } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storage, storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { clearZenPay } from '../LogoutFragment';
import { warn } from '../../utils/log';
import { ATextInput } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';

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

    const [zenPayAppUrl, setZenPayAppUrl] = React.useState(storage.getString('zenpay-app-url') ?? 'https://next.zenpay.org');

    const onUrlSet = React.useCallback(
        (link: string) => {
            let url: URL
            try {
                url = new URL(link);
                setZenPayAppUrl(url.toString());
            } catch (e) {
                warn(e)
                setZenPayAppUrl('');
            }
        },
        [],
    );

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
                </View>
            </View>
        </View>
    );
});