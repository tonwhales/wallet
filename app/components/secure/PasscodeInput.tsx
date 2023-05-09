import React, { useCallback, useRef, useState } from "react";
import { NativeSyntheticEvent, Platform, Pressable, StyleProp, TextInputKeyPressEventData, View, ViewStyle } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { PasscodeSteps } from "./PasscodeSteps";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';

export const PasscodeInput = React.memo((
    {
        style,
        onEntered,
    }: {
        style?: StyleProp<ViewStyle>,
        onEntered: (passcode: string | null) => Promise<void>,
    }
) => {
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

    const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const { key } = e.nativeEvent;
        if (key === 'Backspace') {
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
        <Animated.View style={shakeStyle}>
            <TextInput
                ref={tref}
                style={{
                    color: 'transparent',
                    width: 0,
                    height: 0,
                }}
                value={passcode ?? ''}
                defaultValue={''}
                onKeyPress={onKeyPress}
                autoComplete='off'
                autoCorrect={false}
                keyboardType={Platform.OS !== 'ios' ? 'numeric' : 'number-pad'}
                secureTextEntry={Platform.OS === 'android'}
                autoCapitalize="none"
                autoFocus={true}
                selectionColor={'transparent'}
                enablesReturnKeyAutomatically={false}
                onSubmitEditing={() => { }}
                blurOnSubmit={false}
            />
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1
                    }
                }}
                onPress={tref.current?.focus}
            >
                <PasscodeSteps
                    state={{
                        passLen: passcode.length,
                        error: isWrong,
                    }}
                // emoji
                />
            </Pressable>
        </Animated.View>
    );
});