import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { PasscodeStep } from "./PasscodeStep";

const defaultPasscodeLen = 6;
const dotSize = 10;

export const PasscodeSteps = React.memo((
    {
        state,
        style,
        emoji,
    }: {
        state: {
            passLen: number,
            error?: boolean,
        },
        style?: StyleProp<ViewStyle>
        emoji?: boolean,
    }
) => {
    const width = defaultPasscodeLen * ((emoji ? 32 : dotSize) + 16);

    return (
        <View style={[
            {
                height: (emoji ? 32 : dotSize) + 4, width: '100%',
                justifyContent: 'center', alignItems: 'center',
                marginVertical: 16,
            },
            style
        ]}>
            <View style={{
                flexDirection: "row",
                justifyContent: 'flex-start', alignItems: 'center',
                width: width, height: dotSize
            }}>
                {new Array(defaultPasscodeLen).fill(0).map((_, index) => {
                    return (
                        <PasscodeStep
                            key={`passcode-step-${index}`}
                            dotSize={dotSize}
                            emoji={emoji}
                            error={state.error}
                            index={index}
                            passLen={state.passLen}
                        />
                    );
                })}
            </View>
        </View>
    );
});