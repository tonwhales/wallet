import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { systemFragment } from '../systemFragment';
import { useAppConfig } from '../utils/AppConfigContext';
import { useEffect, useMemo, useState } from 'react';
import { DeviceEncryption, getDeviceEncryption } from '../storage/getDeviceEncryption';
import { BiometricsState, encryptAndStoreAppKeyWithBiometrics } from '../storage/secureStorage';
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
import { useBiometricsState } from '../engine/hooks/useBiometricsState';
import { setBiometricsState } from '../engine/effects/setBiometricsState';

export const BiometricsSetupFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
    const biometricsState = useBiometricsState();

    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();

    const biometricsProps = useMemo(() => {
        if (!deviceEncryption) {
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
            case 'secret':
                icon = <Ionicons
                    name={'keypad'}
                    size={20}
                    color={'#000'}
                />;
                buttonText = t('secure.protectPasscode');
                break;
            case 'device-passcode':
            case 'device-biometrics':
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

    }, [biometricsState, deviceEncryption]);

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
                try {
                    const authRes = await authContext.authenticateWithPasscode();
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