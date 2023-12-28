import React, { memo, useLayoutEffect, useReducer, useState } from "react";
import { Alert, View } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "../passcode/PasscodeInput";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeSuccess } from "../passcode/PasscodeSuccess";
import { getCurrentAddress } from "../../storage/appState";
import { SecureAuthenticationCancelledError, loadWalletKeys } from "../../storage/walletKeys";
import { PasscodeState, passcodeLengthKey, updatePasscode } from "../../storage/secureStorage";
import { storage } from "../../storage/storage";
import { ToastDuration, useToaster } from "../toast/ToastProvider";
import { useDimensions } from "@react-native-community/hooks";
import { useSetPasscodeState } from "../../engine/hooks";

type Action =
    | { type: 'auth', input: string }
    | { type: 'input' | 're-enter', prev: string, input: string }
    | { type: 'success' }
    | { type: 'passcode-length', length: number }

type Step = 'auth' | 'success';
type InputStep = 'input' | 're-enter';

type ScreenState = {
    step: Step,
    input: string,
    passcodeLength: number,
} | {
    step: InputStep,
    input: string,
    prev: string,
    passcodeLength: number,
};

// reduce steps
function reduceSteps() {
    return (state: ScreenState, action: Action): ScreenState => {
        switch (action.type) {
            case 'auth':
                return {
                    step: 'auth',
                    input: action.input,
                    passcodeLength: state.passcodeLength
                };
            case 're-enter':
                return {
                    step: 're-enter',
                    input: action.input,
                    prev: action.prev,
                    passcodeLength: state.passcodeLength
                };
            case 'input':
                return {
                    step: 'input',
                    input: '',
                    prev: action.prev,
                    passcodeLength: state.passcodeLength
                };
            case 'success':
                return {
                    step: 'success',
                    input: state.input,
                    passcodeLength: state.passcodeLength
                };
            case 'passcode-length':
                return {
                    ...state,
                    passcodeLength: action.length
                };
            default:
                return state;
        }
    };
}

export const PasscodeChange = memo(() => {
    const acc = getCurrentAddress();
    const dimentions = useDimensions();
    const [isFirstRender, setFirstRender] = useState(true);
    const passcodeLength = storage.getNumber(passcodeLengthKey) ?? 6;
    const [state, dispatch] = useReducer(reduceSteps(), { step: 'auth', input: '', passcodeLength });
    const setPascodeState = useSetPasscodeState();
    const navigation = useTypedNavigation();
    const toaster = useToaster();

    useLayoutEffect(() => {
        setFirstRender(false);
    }, []);

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {state.step === 'auth' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={isFirstRender ? undefined : SlideInRight}
                    style={{ height: dimentions.window.height - 156 }}
                >
                    <PasscodeInput
                        passcodeLength={passcodeLength}
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
                    style={{ height: dimentions.window.height - 156 }}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterNew')}
                        passcodeLength={state.passcodeLength}
                        onEntered={(pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                            }
                            dispatch({ type: 're-enter', input: pass, prev: state.prev })
                        }}
                        onPasscodeLengthChange={(length) => dispatch({ type: 'passcode-length', length })}
                    />
                </Animated.View>
            )}

            {state.step === 're-enter' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                    style={{ height: dimentions.window.height - 156 }}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.confirmNew')}
                        passcodeLength={state.passcodeLength}
                        onEntered={async (newPasscode) => {
                            if (newPasscode !== state.input) {
                                throw new Error('Passcodes do not match');
                            }

                            updatePasscode(state.prev, newPasscode);
                            setPascodeState(PasscodeState.Set);

                            toaster.show({
                                message: t('security.passcodeSettings.success'),
                                type: 'default',
                                duration: ToastDuration.SHORT,
                                onDestroy: navigation.goBack
                            });
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