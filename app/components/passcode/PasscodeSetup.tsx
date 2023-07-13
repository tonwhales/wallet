import React, { useEffect, useReducer } from "react";
import { View, Text, Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeInput } from "./PasscodeInput";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { LoadingIndicator } from "../LoadingIndicator";
import { CloseButton } from "../CloseButton";
import { ThemeType, useAppConfig } from "../../utils/AppConfigContext";

type Action = { type: 're-enter' | 'input', input: string, } | { type: 'success' } | { type: 'loading' } | { type: 'passcode-length', length: number };
type Step = 'input' | 're-enter' | 'success' | 'loading';
type ScreenState = {
    step: Step,
    input: string,
    passcodeLength: number,
};

const SetupLoader = React.memo((props: {
    onLoadEnd: (action: Action) => void,
    load: (input: string) => Promise<void>,
    input: string,
    theme: ThemeType
}) => {

    useEffect(() => {
        (async () => {
            try {
                await props.load(props.input);
                props.onLoadEnd({ type: 'success' });
            } catch (e) {
                warn('Failed to encrypt and store with passcode');
                props.onLoadEnd({ type: 're-enter', input: props.input });
            }
        })();
    }, []);

    return (
        <LoadingIndicator
            simple
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
    );
});

function reduceSteps() {
    return (state: ScreenState, action: Action): ScreenState => {
        switch (action.type) {
            case 're-enter':
                return {
                    step: 're-enter',
                    input: action.input,
                    passcodeLength: state.passcodeLength
                };
            case 'input':
                return {
                    step: 'input',
                    input: '',
                    passcodeLength: 6
                };
            case 'loading':
                return {
                    step: 'loading',
                    input: state.input,
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
                    step: state.step,
                    input: state.input,
                    passcodeLength: action.length
                };
            default:
                return state;
        }
    };
}

export const PasscodeSetup = React.memo((
    {
        description,
        onReady,
        initial,
        onLater,
        showSuccess,
        style
    }: {
        description?: string,
        onReady?: (pass: string) => Promise<void>,
        onLater?: () => void,
        initial?: boolean,
        showSuccess?: boolean,
        style?: StyleProp<ViewStyle>,
    }) => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();

    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '', passcodeLength: 6 });

    return (
        <View style={[{ width: '100%', height: '100%', }, style]}>
            {state.step === 'input' && (
                <Animated.View style={{ flexGrow: 1 }} exiting={SlideOutLeft}>
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterNew')}
                        description={description}
                        onEntered={(pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                            }
                            dispatch({ type: 're-enter', input: pass });
                        }}
                        passcodeLength={state.passcodeLength}
                        onPasscodeLengthChange={(length) => dispatch({ type: 'passcode-length', length })}
                    />
                    {!!onLater && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={onLater}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.later')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}

            {state.step === 're-enter' && (
                <Animated.View style={{ flexGrow: 1 }} exiting={SlideOutLeft} entering={SlideInRight}>
                    <PasscodeInput
                        title={t('security.passcodeSettings.confirmNew')}
                        onEntered={(pass) => {
                            if (pass !== state.input) {
                                throw new Error('Passcode does not match');
                            }
                            dispatch({ type: 'loading' });
                        }}
                        passcodeLength={state.passcodeLength}
                    />
                    {!!initial && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => {
                                dispatch({ type: 'input', input: '' });
                            }}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.back')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}
            {state.step === 'success' && showSuccess && (
                <>
                    <PasscodeSuccess
                        onSuccess={navigation.goBack}
                        title={t('security.passcodeSettings.success')}
                    />
                    <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
                </>
            )}
            {state.step === 'loading' && (
                <SetupLoader
                    onLoadEnd={dispatch}
                    load={async (pass) => { await onReady?.(pass) }}
                    input={state.input}
                    theme={Theme}
                />
            )}
        </View>
    );
});