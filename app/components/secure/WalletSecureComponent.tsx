import * as React from 'react';
import { Alert, Platform, View, Text, Image } from 'react-native';
import { BiometricsState, encryptAndStoreAppKeyWithBiometrics, storeBiometricsState } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { RoundButton } from '../RoundButton';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import { useCallback, useState } from 'react';
import { useDimensions } from '@react-native-community/hooks';
import { useTheme } from '../../engine/hooks';

export const WalletSecureComponent = React.memo((props: {
    deviceEncryption: DeviceEncryption,
    passcode: string,
    callback: (res: boolean) => void,
    onLater?: () => void
    import?: boolean
}) => {
    const dimensions = useDimensions();
    const theme = useTheme();
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
    let imgSource = require('@assets/ios-protect-face.webp');

    switch (props.deviceEncryption) {
        case 'face':
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectFaceID')
                : t('secure.protectBiometrics');
            imgSource = Platform.select({
                ios: require('@assets/ios-protect-face.webp'),
                android: require('@assets/and-protect-face.webp')
            });
            break;
        case 'biometric':
        case 'fingerprint':
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectTouchID')
                : t('secure.protectBiometrics');
            imgSource = Platform.select({
                ios: require('@assets/ios-protect-touch.webp'),
                android: require('@assets/and-protect-finger.webp')
            });
            break;
        case 'passcode':
        case 'secret':
            buttonText = t('secure.protectPasscode');
            imgSource = Platform.select({
                ios: require('@assets/ios-protect-passcode.webp'),
                android: require('@assets/and-protect-passcode.webp')
            });
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
                { text: t('secure.onLaterButton'), onPress: props.onLater }
            ]
        );
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: theme.background,
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingHorizontal: 16 }}>
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    aspectRatio: 0.92,
                    width: dimensions.screen.width - 32,
                }}>
                    <Image
                        resizeMode={'contain'}
                        style={{ width: dimensions.screen.width - 32 }}
                        source={imgSource}
                    />
                </View>
                <Text style={{
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    textAlign: 'center',
                    marginTop: 26,
                    color: theme.textPrimary
                }}>
                    {title}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    color: theme.textSecondary,
                    fontSize: 17, lineHeight: 24,
                    marginTop: 12,
                    flexShrink: 1,
                }}>
                    {text}
                </Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={[
                { marginHorizontal: 16, marginTop: 16, alignSelf: 'stretch' },
                Platform.select({ android: { paddingBottom: 16 } })
            ]}>
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
    );
});