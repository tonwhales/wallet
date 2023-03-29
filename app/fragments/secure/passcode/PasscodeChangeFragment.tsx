import { View } from "react-native"
import { PasscodeChange } from "../../../components/Passcode/PasscodeChange";
import { fragment } from "../../../fragment"

export const PasscodeChangeFragment = fragment(() => {

    return (
        <View>
            <PasscodeChange />
        </View>
    );
});