import * as React from 'react';
import { fragment } from '../../fragment';
import { Alert, ImageSourcePropType, Platform, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { encryptData, ensureKeystoreReady } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../utils/getDeviceEncryption';
import { getAppState, markAddressSecured, setAppState } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { mnemonicToWalletKey } from 'ton-crypto';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
import { useTranslation } from 'react-i18next';
import { RoundButton } from '../../components/RoundButton';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { useReboot } from '../../utils/RebootContext';

export const WalletSecureFragment = fragment((props: { mnemonics: string, deviceEncryption: DeviceEncryption, import: boolean }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const reboot = useReboot();
    const { height } = useWindowDimensions();

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback(() => {
        (async () => {
            setLoading(true);
            try {

                // Ensure keystore is ok
                ensureKeystoreReady();

                // Persist key
                if (props.deviceEncryption === 'none') {
                    storage.set('ton-bypass-encryption', true);
                } else {
                    storage.set('ton-bypass-encryption', false);
                }
                const token = await encryptData(Buffer.from(props.mnemonics));

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Persist state
                const state = getAppState();
                setAppState({
                    addresses: [
                        ...state.addresses,
                        {
                            address: contract.address,
                            publicKey: key.publicKey,
                            secretKeyEnc: token
                        }
                    ],
                    selected: state.addresses.length
                });

                // Persist secured flag
                if (props.import) {
                    markAddressSecured(contract.address);
                }

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
    let buttonText = '';
    let title = t('Protect your wallet');
    let text = t('Add an extra layer of security to keep your crypto safe.');

    switch (props.deviceEncryption) {
        case 'face':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_face_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('Protect with Face ID')
                : t('Protect with biometrics');
            break;
        case 'fingerprint':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_touch_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('Protect with Touch ID')
                : t('Protect with biometrics');
            break;
        case 'passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('Protect with Passcode');
            break;
        case 'none':
            icon = <Ionicons
                name="lock-open-outline"
                size={20}
                color="white"
            />;
            buttonText = t('Continue anyway');
            title = t('Your device is not protected');
            text = t('It is highly recommend to enable passcode on your device to protect your assets.')
            break;

        default:
            break;
    }

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <FragmentMediaContent
                    animation={require('../../../assets/animations/lock.json')}
                    title={title}
                    text={text}
                />
                <View style={{ flexGrow: 1 }} />
                <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        onPress={onClick}
                        title={buttonText}
                        loading={loading}
                        iconImage={iconImage}
                        icon={icon}
                    />
                </View>
            </View>
        </View>
    );
});