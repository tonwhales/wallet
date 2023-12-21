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
import { ScreenHeader } from "../ScreenHeader";
import { ThemeType } from "../../engine/state/theme";
import { useTheme } from "../../engine/hooks";
import { ToastDuration, useToaster } from "../toast/ToastProvider";

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
        screenHeaderStyle,
        forced,
        showToast,
    }: {
        description?: string,
        onReady?: (pass: string) => Promise<void>,
        onLater?: () => void,
        initial?: boolean,
        showSuccess?: boolean,
        style?: StyleProp<ViewStyle>,
        onBack?: () => void,
        screenHeaderStyle?: StyleProp<ViewStyle>,
        forced?: boolean,
        showToast?: boolean,
    }) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const toaster = useToaster();

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
                onBackPressed={
                    state.step === 're-enter'
                        ? () => dispatch({ type: 'input', input: '' })
                        : forced
                            ? undefined
                            : onBack ?? navigation.base.goBack
                }
                style={[Platform.select({ android: { paddingHorizontal: 16 } }), screenHeaderStyle]}
                rightButton={state.step === 'input' && !!onLater && (
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                            }
                        }}
                        onPress={onLater}
                    >
                        <Text style={{
                            color: theme.accent,
                            fontSize: 17,
                            fontWeight: '500',
                        }}>
                            {t('common.later')}
                        </Text>
                    </Pressable>
                )}
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
                    load={async (pass) => {
                        await onReady?.(pass);
                        if (showToast) {
                            toaster.show({
                                message: t('security.passcodeSettings.success'),
                                type: 'default',
                                duration: ToastDuration.SHORT,
                                onDestroy: navigation.goBack
                            });
                        }
                    }}
                    input={state.input}
                    theme={theme}
                />
            )}
        </View>
    );
});