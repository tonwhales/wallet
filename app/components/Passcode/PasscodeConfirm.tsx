import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native"
import { decryptKeyWithPasscode, PasscodeLength, TOKEN_KEY } from "../../storage/secureStorage";
import { storage } from "../../storage/storage";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeConfirm = React.memo((props: {
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    backgroundColor?: string,
}) => {
    const { t } = useTranslation();
    const [error, setError] = useState<string>();
    const [value, setValue] = useState<string>();
    const [loading, setLoading] = useState(false);

    const onChange = useCallback(
        async (pass: string) => {
            setError(undefined);
            if (pass.length <= PasscodeLength) {
                setValue(pass);
            }
        },
        [props, value],
    );

    useEffect(() => {
        if (value?.length === PasscodeLength) {
            setLoading(true);
            (async () => {
                const res = storage.getString(TOKEN_KEY);
                if (res) {
                    try {
                        let decrypted = await decryptKeyWithPasscode(res, value);
                        if (props.onSuccess && decrypted.length > 0)
                            props.onSuccess(value);
                        else {
                            setError(t('security.error'));
                            setValue(undefined);
                        }
                    } catch (error) {
                        setError(t('security.error'));
                        setValue(undefined);
                    }
                } else {
                    console.log('[PasscodeConfirm] error');
                    setError(t('security.error'));
                    setValue(undefined);
                }
                setLoading(false);
            })();
        }
    }, [value]);


    useEffect(() => {
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
