import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, View, ViewStyle, Text, Image, Platform, ImageSourcePropType } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { PasscodeKeyboard } from "./PasscodeKeyboard";
import { PasscodeKey } from "./PasscodeKeyButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { DeviceEncryption, getDeviceEncryption } from "../../storage/getDeviceEncryption";
import { Ionicons } from '@expo/vector-icons';
import TouchIos from '../../../assets/ic_touch_ios.svg';
import TouchAndroid from '../../../assets/ic_touch_and.svg';
import FaceIos from '../../../assets/ic_face_id.svg';

export const PasscodeInput = React.memo((
    {
        title,
        description,
        style,
        onRetryBiometrics,
        onEntered,
    }: {
        title?: string,
        description?: string,
        style?: StyleProp<ViewStyle>,
        onRetryBiometrics?: () => void,
        onEntered: (passcode: string | null) => Promise<void> | void,
    }
) => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();
    const [passcode, setPasscode] = useState<string>('');
    const [isWrong, setIsWrong] = React.useState(false);

    const translate = useSharedValue(0);
    const shakeStyle = useAnimatedStyle(() => {
        return { transform: [{ translateX: translate.value }] };
    }, []);
    const doShake = React.useCallback(() => {
        translate.value = withSequence(
            withTiming(-10, { duration: 30 }),
            withRepeat(withTiming(10, { duration: 30 }), 2, true),
            withTiming(0, { duration: 30 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, []);

    const onKeyPress = useCallback((key: PasscodeKey) => {
        if (key === PasscodeKey.LeftActionKey && !!onRetryBiometrics) {
            onRetryBiometrics();
        }
        if (key === PasscodeKey.Backspace) {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key) && passcode.length < 6) {
            setPasscode((prevPasscode) => {
                if (prevPasscode.length < 6) {
                    return prevPasscode + key;
                }
                return prevPasscode;
            });
        }
    }, []);

    useEffect(() => {
        if (passcode.length === 6) {
            (async () => {
                try {
                    await onEntered(passcode);
                } catch (e) {
                    setIsWrong(true);
                }
                setTimeout(() => {
                    setPasscode('');
                    setIsWrong(false);
                }, 1500);
            })();
        }
    }, [passcode]);

    useEffect(() => {
        if (isWrong) {
            doShake();
        }
    }, [isWrong]);

    useEffect(() => {
        if (!!onRetryBiometrics) {
            (async () => {
                const deviceEncryption = await getDeviceEncryption();
                setDeviceEncryption(deviceEncryption);
            })();
        }
    }, []);

    const deviceEncryptionIcon = React.useMemo(() => {
        let iconImage: ImageSourcePropType | undefined;
        let icon: any | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? <FaceIos color={'#000'} style={{ height: 60, width: 100 }} />
                    : <TouchAndroid color={'#000'} style={{ height: 60, width: 100 }} />
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? <TouchIos color={'#000'} style={{ height: 60, width: 100 }} />
                    : <TouchAndroid color={'#000'} style={{ height: 60, width: 100 }} />
                break;
            case 'passcode':
            case 'device-passcode':
            case 'secret':
                icon = <Ionicons
                    name="keypad"
                    size={24}
                    color={'#000'}
                />;
                break;
            case 'device-biometrics':
            case 'none':
                break;
            default:
                break;
        }

        if (iconImage) {
            return <Image source={iconImage} style={{ width: 20, height: 20 }} />;
        } else {
            return icon;
        }
    }, [deviceEncryption]);

    return (
        <View style={[{ flexGrow: 1 }, style]}>
            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                {!!title && (
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17, marginBottom: 8,
                        textAlign: 'center',
                    }}>
                        {title}
                    </Text>
                )}
                <Animated.View style={[shakeStyle, { alignItems: 'center', width: '100%' }]}>
                    <PasscodeSteps
                        state={{
                            passLen: passcode.length,
                            error: isWrong,
                        }}
                    />
                    {description && !isWrong && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 54, left: 0, right: 0,
                                justifyContent: 'center', alignItems: 'center',
                                paddingHorizontal: 16,
                            }}
                            entering={FadeIn}
                            exiting={FadeOut}
                        >
                            <Text style={{
                                fontSize: 15,
                                color: Theme.textSecondary, textAlign: 'center'
                            }}>
                                {description}
                            </Text>
                        </Animated.View>
                    )}
                    {isWrong && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 54, left: 0, right: 0,
                                justifyContent: 'center', alignItems: 'center'
                            }}
                            entering={FadeIn}
                            exiting={FadeOut}
                        >
                            <Text style={{
                                fontSize: 15,
                                color: Theme.dangerZone
                            }}>
                                {t('security.passcodeSettings.error')}
                            </Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </View>
            <View style={{
                flex: 1,
                justifyContent: 'center', alignItems: 'center',
                marginBottom: (safeArea.bottom ?? 16) + 6
            }}>
                <PasscodeKeyboard
                    leftIcon={deviceEncryptionIcon}
                    onKeyPress={onKeyPress}
                />
            </View>
        </View>
    );
});