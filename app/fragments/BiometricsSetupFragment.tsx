import * as React from 'react';
import { Alert, Platform, View, Image, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { systemFragment } from '../systemFragment';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEncryption, getDeviceEncryption } from '../storage/getDeviceEncryption';
import { BiometricsState, encryptAndStoreAppKeyWithBiometrics } from '../storage/secureStorage';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { useKeysAuth } from '../components/secure/AuthWalletKeys';
import { RoundButton } from '../components/RoundButton';
import { warn } from '../utils/log';
import { useTheme } from '../engine/hooks';
import { useSetBiometricsState } from '../engine/hooks';
import { useDimensions } from '@react-native-community/hooks';
import { ThemeStyle } from '../engine/state/theme';
import { ScreenHeader } from '../components/ScreenHeader';

export const BiometricsSetupFragment = systemFragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const dimensions = useDimensions();
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
    const setBiometricsState = useSetBiometricsState();

    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();

    let dark = theme.style === ThemeStyle.Dark;

    let buttonText = '';
    let title = t('secure.title');
    let text = t('secure.subtitle');
    let imgSource = require('@assets/ios-protect-face.webp');

    switch (deviceEncryption) {
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

    useEffect(() => {
        (async () => {
            const encryption = await getDeviceEncryption();
            setDeviceEncryption(encryption);
        })();
    }, []);

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = useCallback((bypassEncryption?: boolean) => {
        (async () => {
            setLoading(true);
            try {
                try {
                    const authRes = await authContext.authenticateWithPasscode({ backgroundColor: theme.elevation, cancelable: true });
                    await encryptAndStoreAppKeyWithBiometrics(authRes.passcode);

                    setBiometricsState(BiometricsState.InUse);
                } catch (e) {
                    // Ignore
                    warn('Failed to generate new key');
                    return;
                }

                navigation.goBack();
            } catch (e) {
                warn('Failed to generate new key');
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: theme.elevation,
            justifyContent: 'center',
            alignContent: 'center',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <ScreenHeader
                onClosePressed={navigation.goBack}
                style={[{ zIndex: 100 }]}
            />
            <ScrollView
                bounces={false}
                style={{ height: dimensions.window.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}
            >
                <View style={{
                    justifyContent: 'center',
                    flexGrow: 1,
                }}>
                    <View style={{ paddingHorizontal: 16 }}>
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
                    </View>
                </View>
            </ScrollView>
            <View style={[
                {
                    flexGrow: 1,
                    marginHorizontal: 16,
                    alignSelf: 'stretch',
                    justifyContent: 'center',
                },
                Platform.select({ ios: { paddingBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom } })
            ]}>
                <RoundButton
                    onPress={onClick}
                    title={buttonText}
                    loading={loading}
                />
            </View>
        </View>
    );
});