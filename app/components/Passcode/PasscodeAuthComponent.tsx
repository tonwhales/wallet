import React, { useState } from "react";
import { View, Image, Text } from "react-native";
import { Theme } from "../../Theme";
import { PasscodeComponent } from "../Passcode/PasscodeComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";

export const PasscodeAuthComponent = React.memo((
    {
        onSuccess,
        onError,
        onCancel,
    }: {
        onSuccess?: (passcode: string) => void,
        onError?: () => void,
        onCancel?: () => void,
    }
) => {
    const safeArea = useSafeAreaInsets();

    const [warning, setWarning] = useState<string | undefined>();

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
            <PasscodeComponent
                type={'confirm'}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </View>
    )
});