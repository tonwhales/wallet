import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleProp, View, ViewStyle, Text, Platform, Pressable, Image } from "react-native";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { FadeIn, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { PasscodeKeyboard } from "./PasscodeKeyboard";
import { PasscodeKey } from "./PasscodeKeyButton";
import { t } from "../../i18n/t";
import { DeviceEncryption, getDeviceEncryption } from "../../storage/getDeviceEncryption";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../engine/hooks";

import TouchAndroid from '@assets/ic_touch_and.svg';

export const PasscodeInput = memo((
    {
        title,
        description,
        style,
        onRetryBiometrics,
        onMount,
        onEntered,
        passcodeLength = 6,
        onPasscodeLengthChange,
        onLogoutAndReset,
    }: {
        title?: string,
        description?: string,
        style?: StyleProp<ViewStyle>,
        onRetryBiometrics?: () => void,
        onMount?: () => void,
        onEntered: (passcode: string | null) => Promise<void> | void,
        passcodeLength?: number,
        onPasscodeLengthChange?: (length: number) => void,
        onLogoutAndReset?: () => void,
    }
) => {
    const theme = useTheme();
    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();
    const [passcode, setPasscode] = useState<string>('');
    const [isWrong, setIsWrong] = useState(false);
    const cleanupTimerIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const translate = useSharedValue(0);
    const shakeStyle = useAnimatedStyle(() => {
        return { transform: [{ translateX: translate.value }] };
    }, []);
    const doShake = useCallback(() => {
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
            return;
        }
        
        clearTimeout(cleanupTimerIdRef.current);
        setIsWrong(false);

        if (key === PasscodeKey.Backspace) {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key)) {
            setPasscode((prevPasscode) => {
                let newState = isWrong ? '' : prevPasscode;

                if (newState.length < passcodeLength) {
                    newState = newState + key;
                }

                if (prevPasscode === newState) {
                    return prevPasscode;
                }
                
                if (newState.length === passcodeLength) {
                    (async () => {
                        try {
                            await onEntered(newState);
                        } catch (e) {
                            setIsWrong(true);
                        }

                        clearTimeout(cleanupTimerIdRef.current);
                        cleanupTimerIdRef.current = setTimeout(() => {
                            setPasscode('');
                            setIsWrong(false);
                        }, 1500);
                    })();
                }
                return newState;
            });
        }
    }, [passcodeLength, passcode, isWrong]);

    useEffect(() => {
        setPasscode('');
        cancelAnimation(translate);
        translate.value = 0;
        setIsWrong(false);
    }, [passcodeLength]);

    useEffect(() => {
        cancelAnimation(translate);
        translate.value = 0;
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

    useEffect(() => {
        if (!!onMount) {
            setTimeout(() => {
                onMount();
            }, 500) // to call pin pad has been rendred for user, some weird bug
        }
    }, []);

    const deviceEncryptionIcon = useMemo(() => {
        let icon: any | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? (
                        <View style={{ height: 60, width: 60, justifyContent: 'center', alignItems: 'center' }}>
                            <Image
                                style={{ height: 32, width: 32 }}
                                resizeMode={'cover'}
                                source={require('@assets/ic-secure-face.png')}
                            />
                        </View>
                    )
                    : <TouchAndroid color={theme.textPrimary} style={{ height: 60, width: 100 }} />
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? (
                        <View style={{ height: 60, width: 60, justifyContent: 'center', alignItems: 'center' }}>
                            <Image
                                style={{ height: 32, width: 32 }}
                                resizeMode={'cover'}
                                source={require('@assets/ic-touch-id.png')}
                            />
                        </View>
                    )
                    : <TouchAndroid color={theme.textPrimary} style={{ height: 60, width: 100 }} />
                break;
            case 'passcode':
            case 'device-passcode':
            case 'secret':
                icon = <View style={{ width: 100, height: 60, justifyContent: 'center', alignItems: 'center', paddingRight: 16, paddingBottom: 4 }}>
                    <Ionicons
                        name={'keypad'}
                        size={24}
                        style={{ width: 24, height: 24 }}
                        color={theme.textPrimary}
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
                        fontSize: 32, marginBottom: 12,
                        textAlign: 'center', color: theme.textPrimary
                    }}>
                        {title}
                    </Text>
                )}
                {description && (
                    <Animated.View
                        style={{
                            justifyContent: 'center', alignItems: 'center',
                            paddingHorizontal: 16,
                            marginBottom: 16
                        }}
                        entering={FadeIn}
                        exiting={FadeOut}
                    >
                        <Text style={{
                            fontSize: 15, lineHeight: 20,
                            color: theme.textSecondary, textAlign: 'center'
                        }}>
                            {description}
                        </Text>
                    </Animated.View>
                )}
                <Animated.View style={[shakeStyle, { alignItems: 'center', width: '100%' }]}>
                    <PasscodeSteps
                        state={{
                            passLen: passcode.length,
                            error: isWrong,
                        }}
                        passcodeLength={passcodeLength}
                    />
                    {!!onPasscodeLengthChange && (
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
                                    color: theme.accent, textAlign: 'center'
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
                                color: theme.accentRed
                            }}>
                                {t('security.passcodeSettings.error')}
                            </Text>
                        </Animated.View>
                    )}
                    {!!onLogoutAndReset && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 82, left: 0, right: 0,
                                justifyContent: 'center', alignItems: 'center'
                            }}
                            entering={FadeIn}
                            exiting={FadeOut}
                        >
                            <Text style={{
                                fontSize: 15, lineHeight: 20,
                                color: theme.textSecondary, marginBottom: 8
                            }}>
                                {t('security.passcodeSettings.forgotPasscode')}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15, lineHeight: 20,
                                    color: theme.accentRed
                                }}
                                onPress={onLogoutAndReset}
                            >
                                {t('security.passcodeSettings.logoutAndReset')}
                            </Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <PasscodeKeyboard
                    leftIcon={deviceEncryptionIcon}
                    onKeyPress={onKeyPress}
                />
            </View>
        </View>
    );
});