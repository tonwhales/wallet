import React, { memo, useCallback, useEffect, useLayoutEffect, useReducer } from "react";
import { View, Text, Pressable, StyleProp, ViewStyle, Platform } from "react-native";
import Animated, { FadeOutDown, SlideInRight } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeInput } from "./PasscodeInput";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { LoadingIndicator } from "../LoadingIndicator";
import { CloseButton } from "../navigation/CloseButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { HeaderBackButton } from "@react-navigation/elements";
import { AndroidToolbar } from "../topbar/AndroidToolbar";
import { ThemeType } from "../../utils/Theme";
import { ScreenHeader } from "../ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Action = { type: 're-enter' | 'input', input: string, } | { type: 'success' } | { type: 'loading' } | { type: 'passcode-length', length: number };
type Step = 'input' | 're-enter' | 'success' | 'loading';
type ScreenState = {
    step: Step,
    input: string,
    passcodeLength: number,
};

const SetupLoader = memo((props: {
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
                    passcodeLength: state.passcodeLength
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

export const PasscodeSetup = memo((
    {
        description,
        onReady,
        initial,
        onLater,
        showSuccess,
        style,
        onBack,
    }: {
        description?: string,
        onReady?: (pass: string) => Promise<void>,
        onLater?: () => void,
        initial?: boolean,
        showSuccess?: boolean,
        style?: StyleProp<ViewStyle>,
        onBack?: () => void,
    }) => {
    const safeArea = useSafeAreaInsets()
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();

    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '', passcodeLength: 4 });

    const goBack = useCallback((e: any) => {
        if (state.step === 're-enter') {
            e.preventDefault();
            dispatch({ type: 'input', input: '' });
            return;
        }
        if (onBack) {
            e.preventDefault();
            onBack();
            return;
        }

        navigation.base.dispatch(e.data.action);
    }, [state, navigation, onBack]);

    useLayoutEffect(() => {
        if (Platform.OS === 'android') {
            navigation.base.addListener('beforeRemove', goBack);
        }

        return () => {
            if (Platform.OS === 'android') {
                navigation.base.removeListener('beforeRemove', goBack);
            }
        }
    }, [navigation, goBack]);

    return (
        <View style={[{ flexGrow: 1, width: '100%', height: '100%', }, style]}>
            <ScreenHeader
                onBackPressed={() => {
                    if (state.step === 're-enter') {
                        dispatch({ type: 'input', input: '' });
                        return;
                    }
                    if (onBack) {
                        onBack();
                    } else {
                        navigation.base.goBack();
                    }
                }}
                style={[{ paddingTop: 32 }, Platform.select({ android: { paddingLeft: 16 } })]}
                statusBarStyle={Theme.style === 'dark' ? 'light' : 'dark'}
            />
            {state.step === 'input' && (
                <Animated.View style={{ flexGrow: 1 }} exiting={FadeOutDown}>
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
                <Animated.View style={{ flexGrow: 1 }} exiting={FadeOutDown} entering={SlideInRight}>
                    <PasscodeInput
                        title={t('security.passcodeSettings.confirmNew')}
                        description={description}
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