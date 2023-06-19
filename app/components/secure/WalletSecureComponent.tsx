import * as React from 'react';
import { Alert, ImageSourcePropType, Platform, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BiometricsState, generateNewKeyAndEncrypt, storeBiometricsEncKey, storeBiometricsState } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { RoundButton } from '../RoundButton';
import { FragmentMediaContent } from '../FragmentMediaContent';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { mnemonicToWalletKey } from 'ton-crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { getAppState, getBackup, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { useReboot } from '../../utils/RebootContext';

export const WalletSecureComponent = React.memo((props: {
    mnemonics: string,
    deviceEncryption: DeviceEncryption,
    callback: (res: boolean) => void,
    onLater?: () => void,
    import?: boolean
}) => {
    const reboot = useReboot();
    const navigation = useTypedNavigation();
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    let disableEncryption =
        (props.deviceEncryption === 'none')
        || (props.deviceEncryption === 'device-biometrics')
        || (props.deviceEncryption === 'device-passcode')
        || (Platform.OS === 'android' && Platform.Version < 30) // Encryption doesn't work well on older androids

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback(() => {
        (async () => {
            setLoading(true);
            try {

                // Generate New Key
                let secretKeyEnc = await generateNewKeyAndEncrypt(
                    false,
                    Buffer.from(props.mnemonics)
                );

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Save to storage and default state to Use biometrics
                storeBiometricsEncKey(contract.address.toFriendly({ testOnly: AppConfig.isTestnet }), secretKeyEnc);
                storeBiometricsState(contract.address.toFriendly({ testOnly: AppConfig.isTestnet }), BiometricsState.InUse);

                props.callback(true);
            } catch (e) {
                warn('Failed to generate new key');
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
                props.callback(false);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    let iconImage: ImageSourcePropType | undefined;
    let icon: any | undefined;
    let buttonText = '';
    let title = t('secure.title');
    let text = t('secure.subtitle');

    switch (props.deviceEncryption) {
        case 'face':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_face_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectFaceID')
                : t('secure.protectBiometrics');
            break;
        case 'biometric':
        case 'fingerprint':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_touch_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectTouchID')
                : t('secure.protectBiometrics');
            break;
        case 'device-biometrics':
            buttonText = t('secure.protectBiometrics');
            break;
        case 'device-passcode':
        case 'passcode':
        case 'secret':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        case 'none':
            icon = <Ionicons
                name="lock-open-outline"
                size={20}
                color="white"
            />;
            buttonText = t('common.continueAnyway');
            title = t('secure.titleUnprotected');
            text = t('secure.subtitleUnprotected');
            break;

        default:
            break;
    }

    const onLater = React.useCallback(() => {
        Alert.alert(
            t('secure.onLaterTitle'),
            t('secure.onLaterMessage'),
            [
                { text: t('common.cancel') },
                {
                    text: t('secure.onLaterButton'), onPress: props.onLater
                }
            ]
        );
    }, []);

    if (disableEncryption) {
        if (props.import) {
            let state = getAppState();
            if (!state) {
                throw Error('Invalid state');
            }
            const account = getCurrentAddress();
            markAddressSecured(account.address, AppConfig.isTestnet);
            reboot();
            return null;
        }
        navigation.navigate('WalletBackupInit')
        return null;
    }

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: Theme.item,
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <View style={{ flexGrow: 1 }} />
                <FragmentMediaContent
                    animation={require('../../../assets/animations/lock.json')}
                    title={title}
                    text={text}
                />
                <View style={{ flexGrow: 1 }} />
                <View style={{ height: props.onLater ? 128 : 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        onPress={onClick}
                        title={buttonText}
                        loading={loading}
                        iconImage={iconImage}
                        icon={icon}
                    />
                    {props.onLater && (
                        <Pressable
                            onPress={onLater}
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1,
                                    alignSelf: 'center',
                                    marginTop: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }
                            }}
                            hitSlop={{
                                top: 12,
                                left: 100,
                                bottom: 12,
                                right: 100
                            }}
                        >
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: Theme.accentText
                            }}>
                                {t('common.later')}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
});