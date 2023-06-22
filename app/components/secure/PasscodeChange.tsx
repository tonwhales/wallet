import React, { useReducer } from "react";
import { View } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "../passcode/PasscodeInput";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeSuccess } from "../passcode/PasscodeSuccess";
import { getCurrentAddress } from "../../storage/appState";
import { loadWalletKeys } from "../../storage/walletKeys";
import { migrateToNewPasscode } from "../../storage/secureStorage";

type Action =
    | { type: 'auth', input: string }
    | { type: 'input' | 're-enter', prev: string, input: string }
    | { type: 'success' }

type Step = 'auth' | 'success';
type InputStep = 'input' | 're-enter';

type ScreenState = {
    step: Step,
    input: string,
} | {
    step: InputStep,
    input: string,
    prev: string,
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
                    input: action.input,
                    prev: action.prev
                };
            case 'input':
                return {
                    step: 'input',
                    input: '',
                    prev: action.prev
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
    const acc = getCurrentAddress();
    const [state, dispatch] = useReducer(reduceSteps(), { step: 'auth', input: '' });
    const navigation = useTypedNavigation();

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            {state.step === 'auth' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterPrevious')}
                        onEntered={async (pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                            }
                            await loadWalletKeys(acc.secretKeyEnc, pass);
                            dispatch({ type: 'input', input: '', prev: pass });
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
                            }
                            dispatch({ type: 're-enter', input: pass, prev: state.prev })
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
                        onEntered={async (newPasscode) => {
                            if (newPasscode !== state.input) {
                                throw new Error('Passcodes do not match');
                            }

                            migrateToNewPasscode(state.prev, newPasscode);

                            dispatch({ type: 'success' });
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