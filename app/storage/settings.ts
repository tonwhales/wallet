import { storage } from "./storage";

export const Settings = {
    setPasscode(passcode: string) {
        storage.set('security_passcode', passcode);
    },

    clearPasscode() {
        storage.delete('security_passcode');
    },

    getPasscode() {
        console.log('[getPasscode]', storage.getString('security_passcode'));
        return storage.getString('security_passcode');
    },

    markUseBiometry(value: boolean) {
        storage.set('security_use_biometry', value);
    },

    useBiometry() {
        return storage.getBoolean('security_use_biometry');
    }
}