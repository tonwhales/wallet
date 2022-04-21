import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { decryptKeyWithPasscode, PasscodeLength, TOKEN_KEY } from "../../storage/secureStorage";
import { storage } from "../../storage/storage";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeConfirm = React.memo((props: {
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    backgroundColor?: string
}) => {
    const { t } = useTranslation();
    const [error, setError] = useState<string>();
    const [value, setValue] = useState<string>();

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (pass.length <= PasscodeLength) {
                setValue(pass);
                if (pass.length === PasscodeLength) {
                    console.log('[PasscodeConfirm] onchange');
                    const res = storage.getString(TOKEN_KEY);
                    if (res) {
                        try {
                            decryptKeyWithPasscode(Buffer.from(res, 'base64'), pass);
                            if (props.onSuccess) props.onSuccess(pass);
                        } catch (error) {
                            setError(t('security.error'));
                            setValue(undefined);
                        }
                    } else {
                        console.log('[PasscodeConfirm] error');
                        setError(t('security.error'));
                        setValue(undefined);
                    }
                }
            }
        },
        [props, value],
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
        const lockHardwareBack = () => {
            console.log('lockHardwareBack');
            if (props.onCancel) {
                props.onCancel();
                return true;
            }
            return true;
        }

        BackHandler.addEventListener('hardwareBackPress', lockHardwareBack);

        return () => BackHandler.removeEventListener('hardwareBackPress', lockHardwareBack)
    }, []);

    return (
        <View style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0, left: 0,
            backgroundColor: props.backgroundColor ? props.backgroundColor : 'white',
            alignItems: 'center'
        }}>
            {/* TODO move do enter animations */}
            <Animated.View style={{
                ...opacityStyle,
                alignItems: 'center',
                flex: 1, flexGrow: 1
            }}>
                <View style={{ flexGrow: 1 }} />
                <PasscodeInput
                    error={error}
                    title={t('security.confirm')}
                    value={value}
                    onChange={onChange}
                    onCancel={props.onCancel}
                />
                <View style={{ flexGrow: 1 }} />
            </Animated.View>
        </View>
    );
});
