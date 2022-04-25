import React, { useCallback, useEffect, useState } from "react"
import { BackHandler, View } from "react-native"
import { t } from "../../i18n/t";
import { decryptKeyWithPasscode, PasscodeLength, TOKEN_KEY } from "../../storage/secureStorage";
import { storage } from "../../storage/storage";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeConfirm = React.memo((props: {
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    backgroundColor?: string,
}) => {
    const [error, setError] = useState<string>();
    const [value, setValue] = useState<string>();
    const [loading, setLoading] = useState(false);

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (pass.length <= PasscodeLength) {
                setValue(pass);
            }
        },
        [],
    );

    useEffect(() => {
        if (value && value.length === PasscodeLength) {
            setLoading(true);
            const res = storage.getString(TOKEN_KEY);
            if (res) {
                decryptKeyWithPasscode(res, value).then((decrypted) => {
                    if (props.onSuccess && decrypted.length > 0)
                        props.onSuccess(value);
                    else {
                        setError(t('security.error'));
                        setValue(undefined);
                    }
                }).catch(() => {
                    setError(t('security.error'));
                    setValue(undefined);
                }).finally(() => setLoading(false));
            } else {
                setError(t('security.error'));
                setValue(undefined);
            }
        }
    }, [value, props]);


    useEffect(() => {
        const lockHardwareBack = () => {
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
            <View style={{
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
                    loading={loading}
                />
                <View style={{ flexGrow: 1 }} />
            </View>
        </View>
    );
});
