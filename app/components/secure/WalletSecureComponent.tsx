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
import { useAppConfig } from '../../utils/AppConfigContext';
import { useCallback, useState } from 'react';

export const WalletSecureComponent = React.memo((props: {
    deviceEncryption: DeviceEncryption,
    passcode: string,
    callback: (res: boolean) => void,
    onLater?: () => void
    import?: boolean
}) => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    // Action
    const [loading, setLoading] = useState(false);
    const onClick = useCallback(() => {
        (async () => {
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
        })();
    }, []);

    let buttonText = '';
    let title = t('secure.title');
    let text = t('secure.subtitle');

    switch (props.deviceEncryption) {
        case 'face':
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectFaceID')
                : t('secure.protectBiometrics');
            break;
        case 'biometric':
        case 'fingerprint':
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectTouchID')
                : t('secure.protectBiometrics');
            break;
        case 'passcode':
        case 'secret':
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
            backgroundColor: Theme.surfacePimary,
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
                <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: (safeArea.bottom === 0 ? 32 : safeArea.bottom) + 16, alignSelf: 'stretch' }}>
                    <RoundButton
                        onPress={onClick}
                        title={buttonText}
                        loading={loading}
                    />
                    {props.onLater && (
                        <RoundButton
                            display={'secondary'}
                            style={{ marginTop: 16 }}
                            onPress={onLater}
                            title={t('common.later')}
                        />
                    )}
                </View>
            </View>
        </View>
    );
});