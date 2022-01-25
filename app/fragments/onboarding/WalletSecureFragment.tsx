import * as React from 'react';
import { fragment } from '../../fragment';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../Theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { encryptData } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../utils/getDeviceEncryption';
import { setAppState } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { mnemonicToWalletKey } from 'ton-crypto';
import LottieView from 'lottie-react-native';
import { contractFromPublicKey } from '../../utils/contractFromPublicKey';
import { useTranslation } from 'react-i18next';
import { useReboot } from '../../Root';
import { RoundButton } from '../../components/RoundButton';

export const WalletSecureFragment = fragment((props: { mnemonics: string, deviceEncryption: DeviceEncryption, import: boolean }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const reboot = useReboot();

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
                setAppState({ address: contract.address, publicKey: key.publicKey, testnet: false, backupCompleted: props.import });

                // Navigate next
                reboot();
            } catch (e) {
                console.warn(e);
                Alert.alert(t('Secure storage error'), t('Unfortunatelly we are unable to save data. Please, restart your phone.'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    let iconImage: ImageSourcePropType | undefined;
    let icon: any | undefined;
    let title = '';

    switch (props.deviceEncryption) {
        case 'face':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_face_id.png')
                : require('../../../assets/ic_and_touch.png');
            title = Platform.OS === 'ios'
                ? t('Protect with Face ID')
                : t('Protect with biometrics');
            break;
        case 'fingerprint':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_touch_id.png')
                : require('../../../assets/ic_and_touch.png');
            title = Platform.OS === 'ios'
                ? t('Protect with Touch ID')
                : t('Protect with biometrics');
            break;
        case 'passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            title = t('Protect with Passcode');
            break;
        case 'none':
            icon = <Ionicons
                name="lock-open-outline"
                size={20}
                color="white"
            />;
            title = t('Continue anyway');
            break;

        default:
            break;
    }

    console.log('iconImage', iconImage);

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'stretch',
            backgroundColor: 'white',
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <View style={{ alignItems: 'center', height: 416, marginTop: 8 + 34 + 8 }}>
                    <LottieView
                        source={require('../../../assets/animations/lock.json')}
                        autoPlay={true}
                        loop={false}
                        style={{ width: 140, height: 140 }}
                    />
                    {props.deviceEncryption === 'none' && (
                        <Text style={{
                            marginHorizontal: 26,
                            fontSize: 24,
                            fontWeight: '800',
                            marginTop: 16,
                            textAlign: 'center'
                        }}>
                            {t('Your device is not protected')}
                        </Text>
                    )}
                    {props.deviceEncryption !== 'none' && (
                        <Text style={{
                            marginHorizontal: 26,
                            fontSize: 24,
                            fontWeight: '800',
                            marginTop: 16,
                            textAlign: 'center'
                        }}>
                            {t('Protect your wallet')}
                        </Text>
                    )}
                    {props.deviceEncryption === 'none' && (
                        <Text style={{
                            marginHorizontal: 25,
                            fontSize: 16,
                            fontWeight: '400',
                            marginTop: 11,
                            textAlign: 'center'
                        }}>
                            {t('It is highly recommend to enable passcode on your device to protect your assets.')}
                        </Text>
                    )}
                    {props.deviceEncryption !== 'none' && (
                        <Text style={{
                            marginHorizontal: 25,
                            fontSize: 16,
                            fontWeight: '400',
                            marginTop: 11,
                            textAlign: 'center'
                        }}>
                            {t('Add an extra layer of security to keep your crypto safe.')}
                        </Text>
                    )}
                </View>
            </View>
            <RoundButton
                style={{
                    position: 'absolute',
                    bottom: safeArea.bottom + 16, left: 16, right: 16
                }}
                onPress={onClick}
                title={title}
                loading={loading}
                iconImage={iconImage}
                icon={icon}
            />
        </View>
    );
});