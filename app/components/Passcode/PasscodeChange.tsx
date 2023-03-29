import React, { useState } from "react";
import { Alert, View } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeChange = React.memo(() => {
    const [step, setStep] = useState<'input' | 'confirm'>('input');

    return (
        <View>
            {step === 'input' && (
                <Animated.View exiting={SlideOutLeft}>
                    <PasscodeInput onEntered={(pass) => {
                        setStep('confirm');
                    }} />
                </Animated.View>
            )}

            {step === 'confirm' && (
                <Animated.View entering={SlideInRight}>
                    <PasscodeInput onEntered={(pass) => {
                        Alert.alert('Entered passcode: ' + pass);
                    }} />
                </Animated.View>
            )}
        </View>
    );
});