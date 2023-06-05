import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { Engine } from "../engine/Engine";
import { storage } from "../storage/storage";

const passcodeSetupShownKey = 'passcode-setup-shown';

function isPasscodeSetupShown(): boolean {
    return storage.getBoolean(passcodeSetupShownKey) ?? false;
}

type OnboardingState = 'welcome' | 'upgrade-store' | 'passcode-setup' | 'backup' | 'sync' | 'home';

export function resolveOnboarding(engine: Engine | null, isTestnet: boolean): OnboardingState {
    const state = getAppState();
    const passcodeSetupShown = isPasscodeSetupShown();
    
    if (state.selected >= 0) {
        if (!passcodeSetupShown) {
            return 'passcode-setup';
        }
        const address = getCurrentAddress();
        if (isAddressSecured(address.address, isTestnet)) {
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