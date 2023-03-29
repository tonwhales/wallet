import React, { useCallback, useEffect, useReducer } from "react";
import { Platform, View, Text } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AndroidToolbar } from "../AndroidToolbar";
import { LoadingIndicator } from "../LoadingIndicator";
import { RoundButton } from "../RoundButton";
import { PasscodeInput } from "./PasscodeInput";

type Action = { type: 're-enter' | 'input', input: string, } | { type: 'error' } | { type: 'success' } | { type: 'loading' };
type Step = 'input' | 're-enter' | 'success' | 'error' | 'loading';
type ScreenState = {
    step: Step,
    input: string,
};

function reduceSTeps() {
    return (state: ScreenState, action: Action): ScreenState => {
        switch (action.type) {
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
            case 'error':
                return {
                    step: 'error',
                    input: '',
                };
            case 'loading':
                return {
                    step: 'loading',
                    input: state.input
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

export const PasscodeSetup = React.memo(({ onReady }: { onReady?: (pass: string) => Promise<void> }) => {
    const navigation = useTypedNavigation();
    const onSuccess = useCallback(async (pass: string) => {
        if (onReady) {
            await onReady(pass);
        }
    }, [onReady]);

    const [state, dispatch] = useReducer(reduceSTeps(), { step: 'input', input: '' });

    useEffect(() => {
        if (state.step === 'loading') {
            (async () => {
                try {
                    await onSuccess(state.input);
                    dispatch({ type: 'success' });
                } catch (e) {
                    dispatch({ type: 'error' });
                    warn(e);
                }
            })();
        }
    }, [state.step, state.input, onSuccess]);

    console.log({ step: state.step });

    return (
        <View style={{ flexGrow: 1 }}>
            <AndroidToolbar pageTitle={
                state.step === 'input' ? t('security.passcodeSettings.setupTitle') : t('security.passcodeSettings.confirmTitle')
            } />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {state.step === 'input' ? t('security.passcodeSettings.setupTitle') : t('security.passcodeSettings.confirmTitle')}
                    </Text>
                </View>
            )}
            <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
            }}>
                {state.step === 'input' && (
                    <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
                        <PasscodeInput onEntered={(pass) => {
                            dispatch({
                                type: 're-enter',
                                input: pass
                            });
                        }} />
                    </Animated.View>
                )}

                {state.step === 're-enter' && (
                    <Animated.View exiting={SlideOutLeft} entering={SlideInRight}>
                        <PasscodeInput onEntered={(pass) => {
                            if (pass !== state.input) {
                                dispatch({ type: 'error' });
                            } else {
                                dispatch({ type: 'loading' });
                            }
                        }} />
                    </Animated.View>
                )}

                {state.step === 'error' && (
                    <Animated.View
                        style={{ justifyContent: 'center', alignItems: 'center' }}
                        exiting={SlideOutLeft}
                        entering={SlideInRight}
                    >
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, marginBottom: 16,
                            color: Theme.dangerZone
                        }}>
                            {t('security.passcodeSettings.error')}
                        </Text>
                        <RoundButton
                            title={t('security.passcodeSettings.tryAgain')}
                            onPress={() => {
                                dispatch({
                                    type: 'input',
                                    input: ''
                                });
                            }}
                        />
                    </Animated.View>
                )}

                {state.step === 'success' && (
                    <Animated.View
                        style={{ justifyContent: 'center', alignItems: 'center' }}
                        entering={FadeIn}
                    >
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, marginBottom: 16,
                            color: Theme.success
                        }}>
                            {t('security.passcodeSettings.success')}
                        </Text>
                        <RoundButton
                            title={t('common.back')}
                            onPress={() => {
                                navigation.goBack();
                            }}
                        />
                    </Animated.View>
                )}
            </View>
        </View>
    );
});