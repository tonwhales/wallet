import * as React from 'react';
import { Alert, ImageSourcePropType, Platform, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BiometricsState, encryptAndStoreAppKeyWithBiometrics, storeBiometricsState } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { RoundButton } from '../RoundButton';
import { FragmentMediaContent } from '../FragmentMediaContent';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import { useTheme } from '../../engine/hooks';
import { memo, useCallback, useState } from 'react';

export const WalletSecureComponent = memo((props: {
    deviceEncryption: DeviceEncryption,
    passcode: string,
    callback: (res: boolean) => void,
    onLater?: () => void,
    import?: boolean
}) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    // Action
    const [loading, setLoading] = useState(false);
    const onClick = useCallback((async () => {
        setLoading(true);
        try {
            encryptAndStoreAppKeyWithBiometrics(props.passcode);
            // Save default state to Use biometrics
            storeBiometricsState(BiometricsState.InUse);

            props.callback(true);
        } catch (e) {
            warn('Failed to generate new key');
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            props.callback(false);
        } finally {
            setLoading(false);
        }
    }), []);

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
        case 'secret':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        default:
            break;
    }

    const onLater = useCallback(() => {
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
            backgroundColor: theme.item,
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
                                color: theme.accentText
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