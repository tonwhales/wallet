import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NativeSyntheticEvent, Platform, StyleProp, TextInputKeyPressEventData, View, ViewStyle } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { PasscodeSteps } from "./PasscodeSteps";

export const PasscodeInput = React.memo((
    {
        style,
        onEntered,
    }: {
        style?: StyleProp<ViewStyle>,
        onEntered: (passcode: string) => void,
    }
) => {
    const [passcode, setPasscode] = useState<string>('');
    const [error, setError] = useState<boolean>(false);
    const tref = useRef<TextInput>(null);

    const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const { key } = e.nativeEvent;
        if (key === 'Backspace') {
            setPasscode((prevPasscode) => prevPasscode.slice(0, -1));
        } else if (/\d/.test(key) && passcode.length < 6) {
            setPasscode((prevPasscode) => {
                if ((prevPasscode + key).length === 6) {
                    onEntered(prevPasscode + key);
                }
                return prevPasscode + key
            });
        }
    }, [passcode]);

    return (
        <View>
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
            />
            <PasscodeSteps
                state={{
                    passLen: passcode.length,
                    error: error,
                }}
                emoji
            />
        </View>
    );
});