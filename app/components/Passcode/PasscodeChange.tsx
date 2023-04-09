import React, { useReducer } from "react";
import { View, Text } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "./PasscodeInput";
import { loadWalletKeysWithPassword } from "../../storage/walletKeys";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { RoundButton } from "../RoundButton";
import { encryptAndStoreWithPasscode } from "../../storage/secureStorage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

type Action = { type: 're-enter' | 'input' | 'auth', input: string }
    | { type: 'error' }
    | { type: 'success' }
type Step = 'auth' | 'input' | 're-enter' | 'success' | 'error';
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
            case 'error':
                return {
                    step: 'error',
                    input: '',
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
    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '' });
    const navigation = useTypedNavigation();

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            {state.step === 'auth' && (
                <Animated.View
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
                >
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17, marginBottom: 16,
                        textAlign: 'center'
                    }}>
                        {t('security.passcodeSettings.enterCurrent')}
                    </Text>
                    <PasscodeInput onEntered={async (pass) => {
                        try {
                            const keys = await loadWalletKeysWithPassword(pass);
                            encryptAndStoreWithPasscode(state.input, Buffer.from(keys.mnemonics.join(' ')));
                            dispatch({ type: 'success' });
                        } catch (e) {
                            dispatch({ type: 'error' });
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
                        onPress={() => dispatch({ type: 'input', input: '' })}
                    />
                </Animated.View>
            )}

            {state.step === 'input' && (
                <Animated.View exiting={SlideOutLeft}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17, marginBottom: 16,
                        textAlign: 'center'
                    }}>
                        {t('security.passcodeSettings.enterNew')}
                    </Text>
                    <PasscodeInput onEntered={(pass) => {
                        dispatch({ type: 're-enter', input: pass });
                    }} />
                </Animated.View>
            )}

            {state.step === 're-enter' && (
                <Animated.View entering={SlideInRight}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17, marginBottom: 16,
                        textAlign: 'center'
                    }}>
                        {t('security.passcodeSettings.confirmNew')}
                    </Text>
                    <PasscodeInput onEntered={(pass) => {
                        if (pass !== state.input) {
                            dispatch({ type: 'error' });
                        } else {
                            dispatch({ type: 'auth', input: pass })
                        }
                    }} />
                </Animated.View>
            )}

            {state.step === 'success' && (
                <Animated.View
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                    exiting={SlideOutLeft}
                    entering={SlideInRight}
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
                        onPress={() => navigation.goBack()}
                    />
                </Animated.View>
            )}
        </View>
    );
});