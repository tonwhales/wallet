import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { View, Pressable, Image } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings } from "../../storage/settings";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeComponent = React.memo((props: {
    type?: 'confirm' | 'new' | 'change',
    onSuccess?: () => void,
    onCancel?: () => void
}) => {
    if (!props.type) return null;

    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const [error, setError] = useState<string>();

    const [screenState, setScreenState] = useState<{
        pass?: {
            value?: string,
            confirmValue?: string
        },
        type?: 'reenter' | 'new'
    }>({ type: props.type === 'new' ? 'new' : undefined });

    const onSet = useCallback(
        (value: string) => {
            Settings.setPasscode(value);
            if (props.onSuccess) props.onSuccess();
        },
        [],
    );

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (pass.length <= 4) {
                // Confirming prev entered passcode
                if (screenState.type === 'reenter') {
                    if (pass.length === 4) {
                        // Check if pass is consistent
                        if (pass === screenState.pass?.value) {
                            onSet(pass);
                        } else {
                            setError(t('security.error'));
                        }
                    } else {
                        setScreenState({
                            pass: {
                                confirmValue: pass,
                                value: screenState.pass?.value
                            },
                            type: 'reenter'
                        });
                    }
                } else if (screenState.type === 'new') {
                    // Set new pass state
                    setScreenState(
                        pass.length === 4
                            ? { pass: { value: pass }, type: 'reenter' }
                            : { pass: { value: pass }, type: 'new' }
                    );
                } else {
                    // Check if entered is the same as stored
                    if (pass === Settings.getPasscode()) {
                        if (props.type === 'confirm') {
                            if (props.onSuccess) props.onSuccess();
                        } else if (props.type === 'change') {
                            setScreenState({ type: 'new' });
                        }
                    } else {
                        if (pass.length === 4) {
                            setError(t('security.error'))
                        } else {
                            setScreenState({ pass: { value: pass } });
                        }
                    }
                }
            }
        },
        [screenState, setScreenState, props],
    );

    const opacity = useSharedValue(0);
    const opacityStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(opacity.value, {
                duration: 200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        };
    }, []);

    useEffect(() => {
        opacity.value = 1;
    }, [props.type]);

    return (
        <View style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0, left: 0,
            backgroundColor: 'white',
            alignItems: 'center'
        }}>
            <Animated.View style={{
                ...opacityStyle,
                alignItems: 'center',
                flex: 1, flexGrow: 1
            }}>
                <View style={{ flexGrow: 1 }} />
                <PasscodeInput
                    error={error}
                    title={screenState.type === 'reenter'
                        ? t('security.reenter')
                        : screenState.type === 'new'
                            ? t('security.new')
                            : t('security.confirm')}
                    value={
                        screenState.type === 'reenter'
                            ? screenState.pass?.confirmValue
                            : screenState.pass?.value
                    }
                    onChange={onChange}
                />
                <View style={{ flexGrow: 1 }} />
            </Animated.View>
            {props.onCancel && (
                <Pressable
                    style={({ pressed }) => [{
                        opacity: pressed ? 0.5 : 1,
                        position: 'absolute',
                        top: safeArea.top, right: 16
                    }]}
                    onPress={props.onCancel}
                >
                    <Image source={require('../../../assets/ic_close.png')} />
                </Pressable>
            )}
        </View>
    );
});
