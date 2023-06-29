import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { Engine } from "../engine/Engine";
import { storage } from "../storage/storage";
import { PasscodeState, androidKeyStoreMigrated, getPasscodeState, loadKeyStorageType } from "../storage/secureStorage";
import { Platform } from "react-native";

export const wasPasscodeSetupShownKey = 'passcode-setup-shown';

function isPasscodeSetupShown(): boolean {
    return storage.getBoolean(wasPasscodeSetupShownKey) ?? false;
}

type OnboardingState = 'welcome' | 'upgrade-store' | 'passcode-setup' | 'backup' | 'sync' | 'home' | 'android-key-store-migration';

export function resolveOnboarding(engine: Engine | null, isTestnet: boolean): OnboardingState {
    const state = getAppState();
    const wasPasscodeSetupShown = isPasscodeSetupShown();

    if (state.selected >= 0) {
        const address = getCurrentAddress();
        if (isAddressSecured(address.address, isTestnet)) {
            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            const isKeyStoreMigrated = storage.getBoolean(androidKeyStoreMigrated) ?? false;
            const storageType = loadKeyStorageType();
            const isKeyStore = storageType === 'key-store';

            if (!isKeyStoreMigrated && Platform.OS === 'android' && isKeyStore) {
                return 'android-key-store-migration';
            }

            if (!wasPasscodeSetupShown && !passcodeSet) {
                return 'passcode-setup';
            }
            if (engine && !engine.ready) {
                return 'sync';
            } else {
                return 'home';
            }
        } else {
            return 'backup';
        }
    } else if (canUpgradeAppState()) {
        return 'upgrade-store';
    } else {
        return 'welcome';
    }
}