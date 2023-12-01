import React, { memo } from "react"
import { View, Pressable } from "react-native"
import { PasscodeKey, PasscodeKeyButton } from "./PasscodeKeyButton";
import { useTheme } from "../../engine/hooks";

export const PasscodeKeyboard = memo(({
    onKeyPress,
    leftIcon
}: {
    onKeyPress: (key: PasscodeKey) => void,
    leftIcon?: any,
}) => {
    const theme = useTheme();

    return (
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
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
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
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
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
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
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {!!leftIcon ? (
                    <Pressable
                        onPress={() => onKeyPress(PasscodeKey.LeftActionKey)}
                        style={({ pressed }) => {
                            return {
                                height: 60, width: 60,
                                marginHorizontal: 30, borderRadius: 30,
                                justifyContent: 'center', alignItems: 'center',
                                backgroundColor: pressed ? theme.border : undefined,
                            }
                        }}
                    >
                        {leftIcon}
                    </Pressable>
                ) : (
                    <View style={{ flexGrow: 1 }} />
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