import React, { useCallback, useRef, useState } from "react";
import { StyleProp, View, ViewStyle, Text } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { PasscodeKeyboard } from "./PasscodeKeyboard";
import { PasscodeKey } from "./PasscodeKeyButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";

export const PasscodeInput = React.memo((
    {
        title,
        style,
        onRetryBiometrics,
        onEntered,
    }: {
        title?: string,
        style?: StyleProp<ViewStyle>,
        onRetryBiometrics?: () => void,
        onEntered: (passcode: string | null) => Promise<void> | void,
    }
) => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const [passcode, setPasscode] = useState<string>('');
    const [isWrong, setIsWrong] = React.useState(false);
    const tref = useRef<TextInput>(null);

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
        if (key === PasscodeKey.RetryBiometry && !!onRetryBiometrics) {
            onRetryBiometrics();
        }
        if (key === PasscodeKey.Backspace) {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key) && passcode.length < 6) {
            const newPasscode = passcode + key;
            if (newPasscode.length === 6) {
                (async () => {
                    try {
                        await onEntered(newPasscode);
                    } catch (e) {
                        setIsWrong(true);
                        doShake();
                    }
                    setTimeout(() => {
                        setPasscode('');
                        tref.current?.clear();
                        setIsWrong(false);
                    }, 1500);
                })();
            } else {
                setPasscode(newPasscode);
            }
        }
    }, [passcode]);

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
                <Animated.View style={[shakeStyle, { alignItems: 'center' }]}>
                    <PasscodeSteps
                        state={{
                            passLen: passcode.length,
                            error: isWrong,
                        }}
                    />
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
                <PasscodeKeyboard auth={!!onRetryBiometrics} onKeyPress={onKeyPress} />
            </View>
        </View>
    );
});