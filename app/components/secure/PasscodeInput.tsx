import React, { useCallback, useRef, useState } from "react";
import { StyleProp, View, ViewStyle, Text } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { PasscodeKeyboard } from "./PasscodeKeyboard";
import { PasscodeKey } from "./PasscodeKeyButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const PasscodeInput = React.memo((
    {
        title,
        style,
        onEntered,
    }: {
        title?: string,
        style?: StyleProp<ViewStyle>,
        onEntered: (passcode: string | null) => Promise<void> | void,
    }
) => {
    const safeArea = useSafeAreaInsets();
    const [passcode, setPasscode] = useState<string>('');
    const [isWrong, setIsWrong] = React.useState(false);
    const tref = useRef<TextInput>(null);

    const translate = useSharedValue(0);
    const shakeStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translate.value }],
        };
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
        if (key === PasscodeKey.Backspace) {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key) && passcode.length < 6) {
            setPasscode((prevPasscode) => {
                if ((prevPasscode + key).length === 6) {
                    (async () => {
                        try {
                            await onEntered(prevPasscode + key);
                        } catch (e) {
                            setIsWrong(true);
                            doShake();
                            setTimeout(() => {
                                setPasscode('');
                                tref.current?.clear();
                                setIsWrong(false);
                            }, 1000)
                        }
                    })();
                }
                return prevPasscode + key
            });
        }
    }, [passcode]);

    return (
        <Animated.View style={[shakeStyle, { flexGrow: 1 }, style]}>
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
                <PasscodeSteps
                    state={{
                        passLen: passcode.length,
                        error: isWrong,
                    }}
                />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: (safeArea.bottom ?? 16) + 6 }}>
                <PasscodeKeyboard onKeyPress={onKeyPress} />
            </View>
        </Animated.View>
    );
});