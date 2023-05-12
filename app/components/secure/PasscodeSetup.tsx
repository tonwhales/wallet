import React, { useCallback, useEffect, useReducer } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeInput } from "./PasscodeInput";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { LoadingIndicator } from "../LoadingIndicator";
import { CloseButton } from "../CloseButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useEngine } from "../../engine/Engine";

type Action = { type: 're-enter' | 'input', input: string, } | { type: 'success' } | { type: 'loading' };
type Step = 'input' | 're-enter' | 'success' | 'loading';
type ScreenState = {
    step: Step,
    input: string,
};

function reduceSteps() {
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

export const PasscodeSetup = React.memo(({ onReady, initial }: { onReady?: (pass: string) => Promise<void>, initial?: boolean }) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { Theme } = useAppConfig();
    const onSuccess = useCallback(async (pass: string) => {
        if (onReady) {
            await onReady(pass);
        }
    }, [onReady]);

    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '' });

    useEffect(() => {
        if (state.step === 'loading') {
            (async () => {
                try {
                    await onSuccess(state.input);
                    dispatch({ type: 'success' });
                } catch (e) {
                    warn(e);
                }
            })();
        }
    }, [state.step, state.input, onSuccess]);

    const onLater = useCallback(() => {
        if (engine && !engine.ready) {
            navigation.navigateAndReplaceAll('Sync');
        } else {
            navigation.navigateAndReplaceAll('Home');
        }
    }, [engine]);

    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
            }}>
                {state.step === 'input' && (
                    <Animated.View exiting={SlideOutLeft}>
                        <PasscodeInput
                            title={t('security.passcodeSettings.enterNew')}
                            onEntered={(pass) => {
                                if (!pass) {
                                    throw new Error('Passcode is required');
                                    return;
                                }
                                dispatch({ type: 're-enter', input: pass });
                            }}
                        />
                    </Animated.View>
                )}

                {state.step === 're-enter' && (
                    <Animated.View exiting={SlideOutLeft} entering={SlideInRight}>
                        <PasscodeInput
                            title={t('security.passcodeSettings.confirmNew')}
                            onEntered={(pass) => {
                                if (pass !== state.input) {
                                    throw new Error('Passcode does not match');
                                } else {
                                    dispatch({ type: 'loading' });
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
                {state.step === 'loading' && (
                    <LoadingIndicator simple style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                )}
                {Platform.OS === 'ios' && state.step !== 'input' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            switch (state.step) {
                                case 're-enter':
                                    dispatch({ type: 'input', input: '' });
                                    break;
                                case 'success':
                                    navigation.goBack();
                                    break;
                                case 'loading':
                                    break;
                                default:
                                    break;
                            }

                        }}
                    />
                )}

                {state.step === 'input' && !!initial && (
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
            </View>
        </View>
    );
});