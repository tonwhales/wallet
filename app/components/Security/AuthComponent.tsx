import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, Image, Text } from "react-native";
import { Settings } from "../../storage/settings";
import * as LocalAuthentication from 'expo-local-authentication';
import { Theme } from "../../Theme";
import { PasscodeComponent } from "../Passcode/PasscodeComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";

export const AuthComponent = React.memo((
    {
        onSuccess,
        onError,
        onCancel,
        fallbackToPasscode
    }: {
        onSuccess?: () => void,
        onError?: () => void,
        onCancel?: () => void,
        fallbackToPasscode?: boolean
    }
) => {
    const safeArea = useSafeAreaInsets();
    const type = Settings.useBiometry()
        ? 'biometry'
        : !!Settings.getPasscode()
            ? 'passcode'
            : undefined;


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
                            if (res.error && onError) {
                                onError();
                                return;
                            }
                            setWarning(res.warning);
                        }
                    } catch (error) {
                        if (onError) onError();
                    }
                }
            })();
        }
        if (!type) {
            if (onSuccess) onSuccess();
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
            backgroundColor: Theme.background,
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <View style={{
                height: 416,
                alignItems: 'center',
            }}>
                <View style={{
                    width: 256, height: 256,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <Image source={
                        AppConfig.isTestnet
                            ? require('../../../assets/ic_diamond_test.png')
                            : require('../../../assets/ic_diamond.png')}
                    />
                </View>
                {!!warning && (
                    <Text style={{
                        fontSize: 30, fontWeight: '700',
                        marginTop: -42,
                        textAlign: 'center',
                        color: Theme.warningText
                    }}>
                        {warning}
                    </Text>
                )}
            </View>
            {type === 'passcode' && (
                <PasscodeComponent
                    type={'confirm'}
                    onSuccess={onSuccess}
                    onCancel={onCancel}
                />
            )}
            {type === 'biometry' && onCancel && (
                <Pressable
                    style={({ pressed }) => [{
                        opacity: pressed ? 0.5 : 1,
                        position: 'absolute',
                        top: safeArea.top, right: 16
                    }]}
                    onPress={onCancel}
                >
                    <Image source={require('../../../assets/ic_close.png')} />
                </Pressable>
            )}
        </View>
    )
});