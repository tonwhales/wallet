import * as React from 'react';
import { Alert, ImageSourcePropType, Platform, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateNewKeyAndEncrypt } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { getAppState, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { RoundButton } from '../../components/RoundButton';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useReboot } from '../../utils/RebootContext';

export const WalletSecureFragment = systemFragment((props: {
    mnemonics: string,
    deviceEncryption: DeviceEncryption,
    callback: (res: boolean) => void,
    onLater?: () => void
}) => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback((bypassEncryption?: boolean) => {
        (async () => {
            setLoading(true);
            try {

                // Encrypted token
                let secretKeyEnc: Buffer;

                // Generate New Key
                try {
                    let disableEncryption = !!(props.deviceEncryption === 'none' || props.deviceEncryption === 'device-biometrics' || props.deviceEncryption === 'device-passcode' || bypassEncryption);
                    if (Platform.OS === 'android' && Platform.Version < 30) {
                        disableEncryption = true; // Encryption doesn't work well on older androids
                    }
                    secretKeyEnc = await generateNewKeyAndEncrypt(
                        disableEncryption,
                        Buffer.from(props.mnemonics)
                    );
                } catch (e) {
                    // Ignore
                    warn('Failed to generate new key');
                    return;
                }

                const account = getCurrentAddress();
                markAddressSecured(account.address, AppConfig.isTestnet);

                reboot();
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
        case 'passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        case 'device-biometrics':
            buttonText = t('secure.protectBiometrics');
            break;
        case 'device-passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
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

    const disabled = props.deviceEncryption === 'none';
    if (disabled) {
        text = t('secure.subtitleNoBiometrics');
        buttonText = t('secure.titleUnprotected');
        icon = undefined;
    }

    const continueAnywayAlert = React.useCallback(() => {
        Alert.alert(
            t('secure.titleUnprotected'),
            t('secure.messageNoBiometrics'),
            [
                { text: t('common.cancel') },
                {
                    text: t('common.continueAnyway'), onPress: () => {
                        onClick(true);
                    }
                }
            ])
    }, []);

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
                <View style={{ height: disabled || props.onLater ? 128 : 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        disabled={disabled}
                        onPress={onClick}
                        title={buttonText}
                        loading={loading}
                        iconImage={iconImage}
                        icon={icon}
                    />
                    {disabled && (
                        <Pressable
                            onPress={continueAnywayAlert}
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1,
                                    alignSelf: 'center',
                                    marginTop: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }
                            }}
                        >
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: Theme.accentText
                            }}>
                                {t('common.continueAnyway')}
                            </Text>
                        </Pressable>
                    )}
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