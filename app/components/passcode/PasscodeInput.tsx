import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, View, ViewStyle, Text, Platform, Pressable } from "react-native";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { PasscodeKeyboard } from "./PasscodeKeyboard";
import { PasscodeKey } from "./PasscodeKeyButton";
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
        passcodeLength = 6,
        onPasscodeLengthChange
    }: {
        title?: string,
        description?: string,
        style?: StyleProp<ViewStyle>,
        onRetryBiometrics?: () => void,
        onEntered: (passcode: string | null) => Promise<void> | void,
        passcodeLength?: number,
        onPasscodeLengthChange?: (length: number) => void,
    }
) => {
    const { Theme } = useAppConfig();
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        if (key === PasscodeKey.LeftActionKey && !!onRetryBiometrics) {
            onRetryBiometrics();
        }
        if (key === PasscodeKey.Backspace) {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key) && passcode.length < passcodeLength) {
            setPasscode((prevPasscode) => {
                if (prevPasscode.length < passcodeLength) {
                    return prevPasscode + key;
                }
                return prevPasscode;
            });
        }
    }, [passcodeLength]);

    useEffect(() => {
        if (passcode.length === passcodeLength) {
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
    }, [passcode, passcodeLength]);

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
                icon = <View style={{ width: 100, height: 60, justifyContent: 'center', alignItems: 'center', paddingRight: 16, paddingBottom: 4 }}>
                    <Ionicons
                        name={'keypad'}
                        size={24}
                        style={{ width: 24, height: 24 }}
                        color={'#000'}
                    />
                </View>;
                break;
            case 'device-biometrics':
            case 'none':
                break;
            default:
                break;
        }

        return icon;
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
                        passcodeLength={passcodeLength}
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
                                fontSize: 15, lineHeight: 20,
                                color: Theme.textSecondary, textAlign: 'center'
                            }}>
                                {description}
                            </Text>
                        </Animated.View>
                    )}
                    {!!onPasscodeLengthChange && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: description && !isWrong ? 54 + 40 : 54, left: 0, right: 0,
                                justifyContent: 'center', alignItems: 'center',
                                paddingHorizontal: 16,
                            }}
                            entering={FadeIn}
                            exiting={FadeOut}
                        >
                            <Pressable
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1,
                                    }
                                }}
                                onPress={() => onPasscodeLengthChange(passcodeLength === 6 ? 4 : 6)}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '500',
                                    color: Theme.accent, textAlign: 'center'
                                }}>
                                    {t('security.passcodeSettings.changeLength', { length: passcodeLength === 6 ? 4 : 6 })}
                                </Text>
                            </Pressable>
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
                                fontSize: 15, lineHeight: 20,
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
            }}>
                <PasscodeKeyboard
                    leftIcon={deviceEncryptionIcon}
                    onKeyPress={onKeyPress}
                />
            </View>
        </View>
    );
});