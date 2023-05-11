import React, { useReducer } from "react";
import { View, Text } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "./PasscodeInput";
import { loadWalletKeysWithPassword } from "../../storage/walletKeys";
import { t } from "../../i18n/t";
import { RoundButton } from "../RoundButton";
import { encryptAndStoreWithPasscode } from "../../storage/secureStorage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { useAppConfig } from "../../utils/AppConfigContext";


type Action = { type: 're-enter' | 'input' | 'auth', input: string }
    | { type: 'success' }
type Step = 'auth' | 'input' | 're-enter' | 'success';
type ScreenState = {
    step: Step,
    input: string,
};

// reduce steps
function reduceSteps() {
    return (state: ScreenState, action: Action): ScreenState => {
        switch (action.type) {
            case 'auth':
                return {
                    step: 'auth',
                    input: action.input
                };
            case 're-enter':
                return {
                    step: 're-enter',
                    input: action.input
                };
            case 'input':
                return {
                    step: 'input',
                    input: ''
                };
            case 'success':
                return {
                    step: 'success',
                    input: state.input
                };
            default:
                return state;
        }
    };
}

export const PasscodeChange = React.memo(() => {
    const { Theme } = useAppConfig();
    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '' });
    const navigation = useTypedNavigation();

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            {state.step === 'auth' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterCurrent')}
                        onEntered={async (pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                                return
                            }
                            const keys = await loadWalletKeysWithPassword(pass);
                            await encryptAndStoreWithPasscode(state.input, Buffer.from(keys.mnemonics.join(' ')));
                            dispatch({ type: 'success' });
                        }}
                    />
                </Animated.View>
            )}

            {state.step === 'input' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterNew')}
                        onEntered={(pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                                return;
                            }
                            dispatch({ type: 're-enter', input: pass })
                        }}
                    />
                </Animated.View>
            )}

            {state.step === 're-enter' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.confirmNew')}
                        onEntered={async (pass) => {
                            if (pass !== state.input) {
                                throw new Error('Passcodes do not match');
                            } else {
                                dispatch({ type: 'auth', input: pass })
                            }
                        }}
                    />
                </Animated.View>
            )}

            {state.step === 'success' && (
                <PasscodeSuccess
                    onSuccess={navigation.goBack}
                    title={t('security.passcodeSettings.success')}
                />
            )}
        </View>
    );
});