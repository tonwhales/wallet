import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasscodeLength } from "../../storage/secureStorage";
import { PasscodeConfirm } from "./PasscodeConfirm";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeChange = React.memo((props: {
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    new?: boolean,
    backgroundColor?: string
}) => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const [confirmed, setConfirmed] = useState(props.new);
    const [error, setError] = useState<string>();
    const [screenState, setScreenState] = useState<{
        value?: string,
        reenterValue?: string,
        type: 'new' | 'reenter'
    }>({ type: 'new' });

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (pass.length <= PasscodeLength) {
                if (screenState.type === 'new') {
                    if (pass.length === PasscodeLength) {
                        setScreenState({
                            value: pass,
                            type: 'reenter'
                        });
                        return;
                    }
                    setScreenState({
                        value: pass,
                        type: 'new'
                    });
                } else { // Reenter
                    setScreenState((prevState) => {
                        return {
                            ...prevState,
                            reenterValue: pass
                        }
                    });
                    if (pass.length === PasscodeLength) {
                        if (screenState.value === pass) {
                            console.log({pass})
                            if (props.onSuccess) props.onSuccess(pass);
                        } else {
                            setError(t('security.error'));
                            setScreenState((prevState) => {
                                return {
                                    ...prevState,
                                    reenterValue: undefined
                                }
                            });
                        }
                        return;
                    }
                }
            }
        },
        [props, screenState, setScreenState],
    );

    const onConfirm = useCallback(
        () => {
            setConfirmed(true);
        },
        [],
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
    }, []);

    if (!confirmed) {
        return (
            <PasscodeConfirm
                backgroundColor={props.backgroundColor}
                onSuccess={onConfirm}
                onCancel={props.onCancel}
            />
        );
    }

    return (
        <View style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0, left: 0,
            backgroundColor: props.backgroundColor ? props.backgroundColor : 'white',
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
                    title={screenState.type === 'new' ? t('security.new') : t('security.reenter')}
                    value={screenState.type === 'new' ? screenState.value : screenState.reenterValue}
                    onChange={onChange}
                    onCancel={props.onCancel}
                />
                <View style={{ flexGrow: 1 }} />
            </Animated.View>
        </View>
    );
});
