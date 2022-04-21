import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TOKEN_KEY } from "../../storage/secureStorage";
import { passcodeStorage } from "../../storage/storage";
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
            if (pass.length <= 4) {
                setValue(pass);
                if (pass.length === 4) {
                    if (!!passcodeStorage(pass).getString(TOKEN_KEY)) {
                        if (props.onSuccess) props.onSuccess(pass);
                    } else {
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
    }, []);

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
