import * as React from 'react';
import { fragment } from '../../fragment';
import { ActivityIndicator, Alert, Image, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../Theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { encryptData } from '../../utils/secureStorage';
import { DeviceEncryption } from '../../utils/getDeviceEncryption';
import { getAppState, setAppState, storage } from '../../utils/storage';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { mnemonicToWalletKey } from 'ton-crypto';
import LottieView from 'lottie-react-native';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { useTranslation } from 'react-i18next';

export const WalletSecureFragment = fragment((props: { mnemonics: string, deviceEncryption: DeviceEncryption }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback(() => {
        (async () => {
            setLoading(true);
            try {

                // Persist key
                if (props.deviceEncryption === 'none') {
                    storage.set('ton-bypass-encryption', true);
                } else {
                    storage.set('ton-bypass-encryption', false);
                }
                const token = await encryptData(Buffer.from(props.mnemonics));
                storage.set('ton-mnemonics', token.toString('base64'));

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Persist state
                setAppState({ address: contract.address, publicKey: key.publicKey });

                navigation.navigateAndReplaceAll('WalletCreated');
            } catch (e) {
                console.warn(e);
                Alert.alert(t('Secure storage error'), t('Unfortunatelly we are unable to save data. Please, restart your phone.'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'stretch', backgroundColor: 'white' }}>
            <LottieView
                source={require('../../../assets/animations/lock.json')}
                autoPlay={true}
                loop={false}
                style={{ width: 128, height: 128, marginLeft: 0 }}
            />
            {props.deviceEncryption === 'none' && (
                <Text style={{ marginHorizontal: 16, fontSize: 24 }}>
                    {t('Your device is not protected')}
                </Text>
            )}
            {props.deviceEncryption !== 'none' && (
                <Text style={{ marginHorizontal: 16, fontSize: 24 }}>
                    {t('Protect your wallet')}
                </Text>
            )}
            {props.deviceEncryption === 'none' && (
                <Text style={{ marginHorizontal: 16, marginTop: 8, fontSize: 18 }}>
                    {t('It is highly recommend to enable passcode on your device to protect your assets.')}
                </Text>
            )}
            {props.deviceEncryption !== 'none' && (
                <Text style={{ marginHorizontal: 16, marginTop: 8, fontSize: 18 }}>
                    {t('Add an extra layer of security to keep your crypto safe.')}
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
                            <Image
                                source={
                                    Platform.OS === 'ios'
                                        ? require('../../../assets/face_id.png')
                                        : require('../../../assets/and_touch_id.png')
                                }
                                style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }}
                            />
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                {
                                    Platform.OS === 'ios'
                                        ? t('Protect with Face ID')
                                        : t('Protect with biometrics')
                                }
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'fingerprint' && (
                        <>
                            <Image source={
                                Platform.OS === 'ios'
                                    ? require('../../../assets/face_id.png')
                                    : require('../../../assets/and_touch_id.png')
                            }
                                style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }}
                            />
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                {
                                    Platform.OS === 'ios'
                                        ? t('Protect with Touch ID')
                                        : t('Protect with biometrics')
                                }
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'passcode' && (
                        <>
                            <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                                <Ionicons name="keypad" size={32} color="black" />
                            </View>
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                {t('Protect with Passcode')}
                            </Text>
                        </>
                    )}
                    {props.deviceEncryption === 'none' && (
                        <>
                            <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                                <Ionicons name="lock-open-outline" size={32} color="black" />
                            </View>
                            <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                                {t('Continue anyway')}
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