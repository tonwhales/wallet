import React, { useEffect, useState } from "react"
import { ImageSourcePropType, Platform, View, Image, Pressable } from "react-native"
import { PasscodeKey, PasscodeKeyButton } from "./PasscodeKeyButton";
import { DeviceEncryption, getDeviceEncryption } from "../../storage/getDeviceEncryption";
import { Ionicons } from '@expo/vector-icons';
import TouchIos from '../../../assets/ic_touch_ios.svg';
import TouchAndroid from '../../../assets/ic_touch_and.svg';
import FaceIos from '../../../assets/ic_face_id.svg';

export const PasscodeKeyboard = React.memo(({ onKeyPress, auth }: { onKeyPress: (key: PasscodeKey) => void, auth?: boolean }) => {
    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();

    useEffect(() => {
        if (auth) {
            (async () => {
                const deviceEncryption = await getDeviceEncryption();
                setDeviceEncryption(deviceEncryption);
            })();
        }
    }, []);

    const deviceEncryptionIcon = React.useMemo(() => {
        let iconImage: ImageSourcePropType | undefined;
        let icon: any | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? <FaceIos color={'#000'} style={{ height: 60, width: 100 }} />
                    : <TouchAndroid color={'#000'} style={{ height: 60, width: 100 }} />
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? <TouchIos color={'#000'} style={{ height: 60, width: 100 }} />
                    : <TouchAndroid color={'#000'} style={{ height: 60, width: 100 }} />
                break;
            case 'device-biometrics':
                break;
            case 'passcode':
            case 'device-passcode':
            case 'secret':
                icon = <Ionicons
                    name="keypad"
                    size={24}
                    color={'#000'}
                />;
                break;
            case 'none':
                break;
            default:
                break;
        }

        if (iconImage) {
            return <Image source={iconImage} style={{ width: 20, height: 20 }} />;
        } else {
            return icon;
        }
    }, [deviceEncryption]);

    return (
        <View>
            <View style={{ flexDirection: 'row' }}>
                <PasscodeKeyButton
                    key={PasscodeKey.One}
                    onPress={() => onKeyPress(PasscodeKey.One)}
                    passcodeKey={PasscodeKey.One}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Two}
                    passcodeKey={PasscodeKey.Two}
                    onPress={() => onKeyPress(PasscodeKey.Two)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Three}
                    passcodeKey={PasscodeKey.Three}
                    onPress={() => onKeyPress(PasscodeKey.Three)}
                />
            </View>
            <View style={{ flexDirection: 'row' }}>
                <PasscodeKeyButton
                    key={PasscodeKey.Four}
                    passcodeKey={PasscodeKey.Four}
                    onPress={() => onKeyPress(PasscodeKey.Four)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Five}
                    passcodeKey={PasscodeKey.Five}
                    onPress={() => onKeyPress(PasscodeKey.Five)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Six}
                    passcodeKey={PasscodeKey.Six}
                    onPress={() => onKeyPress(PasscodeKey.Six)}
                />
            </View>
            <View style={{ flexDirection: 'row' }}>
                <PasscodeKeyButton
                    key={PasscodeKey.Seven}
                    passcodeKey={PasscodeKey.Seven}
                    onPress={() => onKeyPress(PasscodeKey.Seven)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Eight}
                    passcodeKey={PasscodeKey.Eight}
                    onPress={() => onKeyPress(PasscodeKey.Eight)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Nine}
                    passcodeKey={PasscodeKey.Nine}
                    onPress={() => onKeyPress(PasscodeKey.Nine)}
                />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                {!!deviceEncryptionIcon && (
                    <Pressable
                        onPress={() => onKeyPress(PasscodeKey.RetryBiometry)}
                        style={({ pressed }) => {
                            return { opacity: pressed ? 0.5 : 1, height: 60, width: 100, justifyContent: 'center', alignItems: 'center' }
                        }}
                    >
                        {deviceEncryptionIcon}
                    </Pressable>
                )}
                <PasscodeKeyButton
                    key={PasscodeKey.Zero}
                    passcodeKey={PasscodeKey.Zero}
                    onPress={() => onKeyPress(PasscodeKey.Zero)}
                />
                <PasscodeKeyButton
                    key={PasscodeKey.Backspace}
                    passcodeKey={PasscodeKey.Backspace}
                    onPress={() => onKeyPress(PasscodeKey.Backspace)}
                />
            </View>
        </View>
    );
})