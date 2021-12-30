import * as React from 'react';
import { fragment } from '../../fragment';
import { ActivityIndicator, Alert, Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../Theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { encryptData } from '../../utils/secureStorage';
import { DeviceEncryption } from '../../utils/getDeviceEncryption';
import { storage } from '../../utils/storage';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const WalletSecureFragment = fragment((props: { mnemonics: string, deviceEncryption: DeviceEncryption }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback(() => {
        (async () => {
            setLoading(true);
            try {
                if (props.deviceEncryption === 'none') {
                    storage.set('ton-bypass-encryption', true);
                } else {
                    storage.set('ton-bypass-encryption', false);
                }
                const token = await encryptData(Buffer.from(props.mnemonics));
                storage.set('ton-mnemonics', token.toString('base64'));
                navigation.navigateAndReplaceAll('WalletCreated');
            } catch (e) {
                console.warn(e);
                Alert.alert('Secure storage error', 'Unfortunatelly we are unable to save data. Please, restart your phone.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'stretch' }}>
            {props.deviceEncryption === 'none' && (
                <Text style={{ marginHorizontal: 24, fontSize: 24 }}>
                    Your device is not protected
                </Text>
            )}
            {props.deviceEncryption !== 'none' && (
                <Text style={{ marginHorizontal: 24, fontSize: 24 }}>
                    Protect your wallet
                </Text>
            )}
            {props.deviceEncryption === 'none' && (
                <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 18 }}>
                    It is highly recommend to enable passcode on your device to protect your assets.
                </Text>
            )}
            {props.deviceEncryption !== 'none' && (
                <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 18 }}>
                    Add an extra layer of security to keep your crypto safe.
                </Text>
            )}
            <View style={{ flexGrow: 1 }} />
            <TouchableOpacity onPress={onClick}>
                <View
                    style={{
                        marginBottom: safeArea.bottom + 16,
                        marginHorizontal: 16,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: Theme.divider,
                        alignSelf: 'stretch',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                >
                    {props.deviceEncryption === 'face' && (
                        <>
                            <Image source={require('../../../assets/face_id.png')} style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }} />
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                Protect with Face ID
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'fingerprint' && (
                        <>
                            <Image source={require('../../../assets/touch_id.png')} style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }} />
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                Protect with Touch ID
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'passcode' && (
                        <>
                            <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                                <Ionicons name="keypad" size={32} color="black" />
                            </View>
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                Protect with Passcode
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'none' && (
                        <>
                            <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                                <Ionicons name="lock-open-outline" size={32} color="black" />
                            </View>
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                Continue anyway
                            </Text>
                        </>
                    )}
                    <View style={{ marginRight: 16 }}>
                        {loading && (<ActivityIndicator color={Theme.loader} />)}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
});