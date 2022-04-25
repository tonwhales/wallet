import React, { useCallback, useEffect, useState } from "react"
import { View } from "react-native"
import { t } from "../../i18n/t";
import { PasscodeLength } from "../../storage/secureStorage";
import { PasscodeConfirm } from "./PasscodeConfirm";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeChange = React.memo((props: {
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    new?: boolean,
    backgroundColor?: string
}) => {
    const [loading, setLoading] = useState(false);
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
                }
            }
        },
        [props, screenState, setScreenState],
    );

    useEffect(() => {
        if (screenState.reenterValue?.length === PasscodeLength) {
            if (screenState.value === screenState.reenterValue) {
                setLoading(true);
                if (props.onSuccess) props.onSuccess(screenState.reenterValue);
            } else {
                setLoading(false);
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
    }, [screenState]);

    const onConfirm = useCallback(
        () => setConfirmed(true),
        [],
    );

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
            <View style={{ flexGrow: 1 }} />
            <PasscodeInput
                error={error}
                title={screenState.type === 'new' ? t('security.new') : t('security.reenter')}
                value={screenState.type === 'new' ? screenState.value : screenState.reenterValue}
                onChange={onChange}
                onCancel={props.onCancel}
                loading={loading}
            />
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});
