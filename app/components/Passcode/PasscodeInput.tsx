import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
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

    useEffect(() => {
        tref.current?.focus();
    }, []);

    const onTextChange = useCallback((newVal: string) => {
        if (newVal.length > 6) return;
        setPasscode(newVal);
        if (newVal.length === 6) {
            onEntered(newVal);
        }
    }, []);

    return (
        <View>
            <TextInput
                ref={tref}
                style={{
                    color: 'transparent',
                    width: 0,
                    height: 0,
                }}
                value={passcode}
                onChangeText={onTextChange}
                autoComplete='off'
                autoCorrect={false}
                keyboardType={'number-pad'}
                autoCapitalize="none"
                autoFocus={true}
                selectionColor={'transparent'}
            />
            <PasscodeSteps
                state={{
                    passLen: passcode.length,
                    error: error,
                }}
                // emoji
            />
        </View>
    );
});