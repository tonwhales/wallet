import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Settings } from "../../storage/settings";
import * as LocalAuthentication from 'expo-local-authentication';
import { Theme } from "../../Theme";
import { PasscodeComponent } from "./PasscodeComponent";

export const AuthComponent = React.memo((
    {
        onSuccess,
        onError,
        onCancel,
    }: {
        onSuccess?: () => void,
        onError?: () => void,
        onCancel?: () => void
    }
) => {
    const [type, setType] = useState<'biometry' | 'passcode' | undefined>(
        Settings.useBiometry()
            ? 'biometry'
            : !!Settings.getPasscode()
                ? 'passcode'
                : undefined
    );
    const [warning, setWarning] = useState<string | undefined>();

    useEffect(() => {
        if (type === 'biometry') {
            (async () => {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                if (types.length > 0 && enrolled) {
                    try {
                        const res = await LocalAuthentication.authenticateAsync();
                        if (res.success) {
                            if (onSuccess) onSuccess();
                        } else {
                            setWarning(res.warning || res.error);
                        }
                    } catch (error) {
                        if (onError) onError();
                    }
                }
            })();
        }
    }, [
        onSuccess,
        onError,
        onCancel,
    ]);

    return (
        <View style={{
            flex: 1,
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: Theme.background
        }}>
            {type === 'passcode' && (
                <PasscodeComponent />
            )}
        </View>
    )
});