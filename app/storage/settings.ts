import { storage } from "./storage";

export const Settings = {
    markUsePasscode(value: boolean) {
        storage.set('security_use_passcode', value);
    },

    usePasscode() {
        return storage.getBoolean('security_use_passcode');
    },

    setPasscode(passcode: string) {
        storage.set('security_passcode', passcode);
    },

    clearPasscode() {
        storage.delete('security_passcode');
    },

    getPasscode() {
        return storage.getString('security_passcode');
    },

    markUseBiometry(value: boolean) {
        storage.set('security_use_biometry', value);
    },

    useUseBiometry() {
        return storage.getBoolean('security_use_biometry');
    }
}