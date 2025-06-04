import React, { memo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { PasscodeStep } from "./PasscodeStep";

const dotSize = 10;

export const PasscodeSteps = memo((
    {
        passcodeLength = 6,
        state,
        style,
        emoji,
        isLoading
    }: {
        passcodeLength?: number,
        state: {
            passLen: number,
            error?: boolean,
        },
        style?: StyleProp<ViewStyle>
        emoji?: boolean,
        isLoading?: boolean,
    }
) => {
    const width = passcodeLength * ((emoji ? 32 : dotSize) + 22);

    return (
        <View style={[
            {
                height: (emoji ? 32 : dotSize) + 4, width: '100%',
                justifyContent: 'center', alignItems: 'center',
                marginTop: 24,
                marginBottom: 16,
            },
            style
        ]}>
            <View style={{
                flexDirection: "row",
                justifyContent: 'flex-start', alignItems: 'center',
                width: width, height: dotSize
            }}>
                {new Array(passcodeLength).fill(0).map((_, index) => {
                    return (
                        <PasscodeStep
                            key={`passcode-step-${index}`}
                            dotSize={dotSize}
                            emoji={emoji}
                            error={state.error}
                            index={index}
                            passLen={state.passLen}
                            isLoading={isLoading}
                            totalSteps={passcodeLength}
                        />
                    );
                })}
            </View>
        </View>
    );
});