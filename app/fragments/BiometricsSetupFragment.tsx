import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { systemFragment } from '../systemFragment';
import { useAppConfig } from '../utils/AppConfigContext';
import { useReboot } from '../utils/RebootContext';
import { useEffect, useMemo, useState } from 'react';
import { DeviceEncryption, getDeviceEncryption } from '../storage/getDeviceEncryption';
import { useEngine } from '../engine/Engine';
import { BiometricsState, generateNewKeyAndEncrypt, getBiometricsMigrated } from '../storage/secureStorage';
import { getCurrentAddress } from '../storage/appState';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { Ionicons } from '@expo/vector-icons';
import TouchIos from '../../assets/ic_touch_ios.svg';
import TouchAndroid from '../../assets/ic_touch_and.svg';
import FaceIos from '../../assets/ic_face_id.svg';
import { useKeysAuth } from '../components/secure/AuthWalletKeys';
import { FragmentMediaContent } from '../components/FragmentMediaContent';
import { RoundButton } from '../components/RoundButton';
import { warn } from '../utils/log';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CloseButton } from '../components/CloseButton';

export const BiometricsSetupFragment = systemFragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const authContext = useKeysAuth();
    const settings = engine.products.settings;
    const acc = getCurrentAddress();
    const biometricsState = settings.useBiometricsState(acc.address);
    const migrated = getBiometricsMigrated(AppConfig.isTestnet);

    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();

    const biometricsProps = useMemo(() => {
        if (!deviceEncryption) {
            return;
        }
        if (!migrated) {
            navigation.goBack();
            return;
        }

        let icon: any | undefined;
        let buttonText: string | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? <FaceIos width={20} height={20} color={'#fff'} />
                    : <TouchAndroid width={20} height={20} color={'#fff'} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectFaceID')
                    : t('secure.protectBiometrics');
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? <TouchIos width={20} height={20} color={'#fff'} />
                    : <TouchAndroid width={20} height={20} color={'#fff'} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectTouchID')
                    : t('secure.protectBiometrics');
                break;
            case 'passcode':
            case 'device-passcode':
            case 'secret':
                icon = <Ionicons
                    name={'keypad'}
                    size={20}
                    color={'#000'}
                />;
                buttonText = t('secure.protectPasscode');
                break;
            case 'device-biometrics':
                buttonText = t('secure.protectBiometrics');
                break;
            case 'none':
                navigation.goBack();
                return;
            default:
                navigation.goBack();
                return;
        }

        return {
            icon,
            buttonText
        }

    }, [biometricsState, migrated, deviceEncryption]);

    useEffect(() => {
        (async () => {
            const encryption = await getDeviceEncryption();
            setDeviceEncryption(encryption);
        })();
    }, []);

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
                    let disableEncryption = !!(deviceEncryption === 'none' || deviceEncryption === 'device-biometrics' || deviceEncryption === 'device-passcode' || bypassEncryption);
                    if (Platform.OS === 'android' && Platform.Version < 30) {
                        disableEncryption = true; // Encryption doesn't work well on older androids
                    }

                    // Shouldn't happen because we check for this in the UI
                    if (disableEncryption) {
                        navigation.goBack();
                        return;
                    }

                    const passcodeKeys = await authContext.authenticateWithPasscode({ cancelable: true });

                    secretKeyEnc = await generateNewKeyAndEncrypt(
                        disableEncryption,
                        Buffer.from(passcodeKeys.mnemonics.join(' '))
                    );

                    settings.setBiometricsState(acc.address, BiometricsState.InUse);
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

    let title = t('secure.title');
    let text = t('secure.subtitle');

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
                    animation={require('../../assets/animations/lock.json')}
                    title={title}
                    text={text}
                />
                <View style={{ flexGrow: 1 }} />
                {biometricsProps && (
                    <Animated.View
                        style={{
                            height: 64,
                            marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom,
                            alignSelf: 'stretch'
                        }}
                        entering={FadeIn}
                    >
                        <RoundButton
                            onPress={onClick}
                            title={biometricsProps.buttonText}
                            loading={loading}
                            icon={biometricsProps.icon}
                        />
                    </Animated.View>
                )}
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});