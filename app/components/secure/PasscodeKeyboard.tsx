import React from "react"
import { View } from "react-native"
import { PasscodeKey, PasscodeKeyButton } from "./PasscodeKeyButton";

export const PasscodeKeyboard = React.memo(({ onKeyPress }: { onKeyPress: (key: PasscodeKey) => void }) => {

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