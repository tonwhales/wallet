import React, { useReducer } from "react";
import { View } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { PasscodeInput } from "./PasscodeInput";
import { WalletKeys, loadWalletKeysWithPassword } from "../../storage/walletKeys";
import { t } from "../../i18n/t";
import { encryptAndStoreWithPasscode } from "../../storage/secureStorage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { getCurrentAddress } from "../../storage/appState";
import { useAppConfig } from "../../utils/AppConfigContext";


type Action = { type: | 'auth', input: string }
    | { type: 're-enter' | 'input', keys: WalletKeys, input: string }
    | { type: 'success' }

type Step = 'auth' | 'input' | 're-enter' | 'success';
type StepWithKeys = 'input' | 're-enter';

type ScreenStateWithKeys = {
    step: StepWithKeys,
    input: string,
    keys: WalletKeys
}

type ScreenState = {
    step: Step,
    input: string,
};

// reduce steps
function reduceSteps() {
    return (state: ScreenState | ScreenStateWithKeys, action: Action): ScreenState | ScreenStateWithKeys => {
        switch (action.type) {
            case 'auth':
                return {
                    step: 'auth',
                    input: action.input
                };
            case 're-enter':
                return {
                    keys: action.keys,
                    step: 're-enter',
                    input: action.input,
                };
            case 'input':
                return {
                    keys: action.keys,
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
    const { AppConfig } = useAppConfig();
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
                                return
                            }
                            const keys = await loadWalletKeysWithPassword(
                                acc.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                pass
                            );
                            await encryptAndStoreWithPasscode(
                                acc.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                state.input,
                                Buffer.from(keys.mnemonics.join(' '))
                            );
                            dispatch({ type: 'input', keys, input: '' });
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
                            dispatch({ type: 're-enter', input: pass, keys: (state as ScreenStateWithKeys).keys })
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
                                await encryptAndStoreWithPasscode(
                                    acc.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    state.input,
                                    Buffer.from((state as ScreenStateWithKeys).keys.mnemonics.join(' '))
                                );
                                dispatch({ type: 'success' });
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