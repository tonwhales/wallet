import { NativeModules, Platform } from "react-native";

const { FlagSecureModule } = NativeModules;

/**
* **(Android Only)**
* activates/deactivates secure mode for the screen when the app goes to background
*/
export const makeScreenSecure = (enabled = true) => {
    if (Platform.OS === 'android') {
        enabled ? FlagSecureModule.activate() : FlagSecureModule.deactivate()
    }
};
