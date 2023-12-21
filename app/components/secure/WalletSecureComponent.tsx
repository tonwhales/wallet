import * as React from 'react';
import { Alert, Platform, View, Text, Image, ScrollView } from 'react-native';
import { BiometricsState, encryptAndStoreAppKeyWithBiometrics } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { RoundButton } from '../RoundButton';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import { memo, useCallback, useState } from 'react';
import { useDimensions } from '@react-native-community/hooks';
import { useSetBiometricsState, useTheme } from '../../engine/hooks';
import { ThemeStyle } from '../../engine/state/theme';
import { ScreenHeader } from '../ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const WalletSecureComponent = memo((props: {
    deviceEncryption: DeviceEncryption,
    passcode: string,
    callback: (res: boolean) => void,
    onLater?: () => void
    import?: boolean
}) => {
    const safeArea = useSafeAreaInsets();
    const dimensions = useDimensions();
    const theme = useTheme();
    // Action
    const [loading, setLoading] = useState(false);
    const setBiometricsState = useSetBiometricsState();
    const onClick = useCallback(() => {
        (async () => {
            setLoading(true);
            try {
                await encryptAndStoreAppKeyWithBiometrics(props.passcode);
                // Save default state to Use biometrics
                setBiometricsState(BiometricsState.InUse);

                props.callback(true);
            } catch (e) {
                warn('Failed to generate new key');
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    let dark = theme.style === ThemeStyle.Dark;

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
                ios: dark ? require('@assets/ios-protect-face-dark.webp') : require('@assets/ios-protect-face.webp'),
                android: dark ? require('@assets/and-protect-face-dark.webp') : require('@assets/and-protect-face.webp')
            });
            break;
        case 'biometric':
        case 'fingerprint':
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectTouchID')
                : t('secure.protectBiometrics');
            imgSource = Platform.select({
                ios: dark ? require('@assets/ios-protect-touch-dark.webp') : require('@assets/ios-protect-touch.webp'),
                android: dark ? require('@assets/and-protect-finger-dark.webp') : require('@assets/and-protect-finger.webp')
            });
            break;
        case 'passcode':
        case 'secret':
            buttonText = t('secure.protectPasscode');
            imgSource = Platform.select({
                ios: dark ? require('@assets/ios-protect-passcode-dark.webp') : require('@assets/ios-protect-passcode.webp'),
                android: dark ? require('@assets/and-protect-passcode-dark.webp') : require('@assets/and-protect-passcode.webp')
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
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                onBackPressed={() => {
                    props.callback(false);
                }}
                style={[{ zIndex: 100, paddingHorizontal: 16, paddingTop: 8 }]}
            />
            <ScrollView
                bounces={false}
                style={{ height: dimensions.window.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}
            >
                <View style={{
                    backgroundColor: theme.backgroundPrimary,
                    justifyContent: 'center',
                    flexGrow: 1,
                }}>
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
                        }}
                            minimumFontScale={0.8}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        <Text
                            style={{
                                textAlign: 'center',
                                color: theme.textSecondary,
                                fontSize: 17, lineHeight: 24,
                                marginTop: 12,
                                flexShrink: 1,
                            }}
                            minimumFontScale={0.9}
                            adjustsFontSizeToFit
                            numberOfLines={3}
                        >
                            {text}
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View style={{
                flexGrow: 1,
                marginHorizontal: 16,
                alignSelf: 'stretch',
                justifyContent: 'flex-end'
            }}>
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