import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { storage } from "../storage/storage";
import { PasscodeState, getPasscodeState, loadKeyStorageType } from "../storage/secureStorage";

export const wasPasscodeSetupShownKey = 'passcode-setup-shown';

function isPasscodeSetupShown(): boolean {
    return storage.getBoolean(wasPasscodeSetupShownKey) ?? false;
}

type OnboardingState = 'welcome' | 'upgrade-store' | 'passcode-setup' | 'backup' | 'sync' | 'home' | 'android-key-store-migration';

export function resolveOnboarding(isTestnet: boolean): OnboardingState {
    const state = getAppState();
    const wasPasscodeSetupShown = isPasscodeSetupShown();

    if (state.selected >= 0) {
        const address = getCurrentAddress();
        if (isAddressSecured(address.address, isTestnet)) {
            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            const storageType = loadKeyStorageType();
            const isKeyStore = storageType === 'key-store';

            if (isKeyStore) {
                return 'android-key-store-migration';
            }

            if (!wasPasscodeSetupShown && !passcodeSet) {
                return 'passcode-setup';
            }
            return 'home';
        } else {
            return 'backup';
        }
    } else if (canUpgradeAppState()) {
        return 'upgrade-store';
    } else {
        return 'welcome';
    }
}