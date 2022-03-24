import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { View, TextInput, Text, Pressable, Image, Platform } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings } from "../../storage/settings";
import { Theme } from "../../Theme";
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
    console.log(props);

    const [screenState, setScreenState] = useState<{
        pass?: {
            value?: string,
            confirmValue?: string
        },
        type?: 'reenter' | 'new'
    }>({ type: props.type === 'new' ? 'new' : undefined });

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (!screenState.type) {
                if (pass.length === 4) {
                    const stored = Settings.getPasscode();
                    if (stored === pass) {
                        if (props.type === 'change') {
                            setScreenState({
                                pass: {
                                    value: pass
                                }
                            });
                            setTimeout(() => setScreenState({
                                type: 'new',
                                pass: undefined
                            }), 100);
                        } else {
                            if (props.onSuccess) props.onSuccess();
                        }
                    } else {
                        setScreenState({
                            pass: {
                                value: pass
                            }
                        });
                        setError(t('security.error'));
                        setTimeout(() => setScreenState({}), 100);
                    }
                } else {
                    setScreenState({
                        pass: {
                            value: pass
                        }
                    });
                }
            } else {
                if (screenState.type === 'new') {
                    if (pass.length === 4) {
                        setScreenState(prev => {
                            return {
                                ...prev,
                                pass: {
                                    value: pass
                                },
                            }
                        });
                        setTimeout(() => setScreenState({
                            pass: {
                                value: pass
                            },
                            type: 'reenter'
                        }), 100);
                    } else {
                        setScreenState(prev => {
                            return {
                                ...prev,
                                pass: {
                                    value: pass
                                },
                            }
                        });
                    }
                } else {
                    if (pass.length === 4) {
                        if (pass === screenState.pass?.value) {
                            setScreenState(prev => {
                                return {
                                    ...prev,
                                    pass: {
                                        value: prev.pass?.value,
                                        confirmValue: pass
                                    },
                                }
                            });
                            setTimeout(() => {
                                Settings.setPasscode(pass);
                                if (props.onSuccess) props.onSuccess();
                            }, 100);
                        } else {
                            setScreenState(prev => {
                                return {
                                    ...prev,
                                    pass: {
                                        value: prev.pass?.value,
                                        confirmValue: pass
                                    },
                                }
                            });
                            setError(t('security.error'));
                            setTimeout(() => setScreenState(prev => {
                                return {
                                    pass: {
                                        value: prev.pass?.value
                                    },
                                    type: 'reenter'
                                }
                            }), 100);
                        }
                    } else {
                        setScreenState(prev => {
                            return {
                                ...prev,
                                pass: {
                                    value: prev.pass?.value,
                                    confirmValue: pass
                                },
                            }
                        });
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
            backgroundColor: Theme.background,
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
