import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { Engine } from "../engine/Engine";
import { storage } from "../storage/storage";
import { PasscodeState, getPasscodeState } from "../storage/secureStorage";

export const wasPasscodeSetupShownKey = 'passcode-setup-shown';

function isPasscodeSetupShown(): boolean {
    return storage.getBoolean(wasPasscodeSetupShownKey) ?? false;
}

type OnboardingState = 'Welcome' | 'WalletUpgrade' | 'PasscodeSetupInit' | 'WalletCreated' | 'Home' | 'AppStartAuth';

export function resolveOnboarding(engine: Engine | null, isTestnet: boolean, appStart?: boolean): OnboardingState {
    const state = getAppState();
    const wasPasscodeSetupShown = isPasscodeSetupShown();
    const authOnStart = engine?.sharedPersistence.lockAppWithAuth.item().value ?? false;

    if (state.selected >= 0) {
        if (authOnStart && appStart) {
            return 'AppStartAuth';
        }
        const address = getCurrentAddress();
        if (isAddressSecured(address.address, isTestnet)) {
            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            if (!wasPasscodeSetupShown && !passcodeSet) {
                return 'PasscodeSetupInit';
            }
            return 'Home';
        } else {
            return 'WalletCreated';
        }
    } else if (canUpgradeAppState()) {
        return 'WalletUpgrade';
    } else {
        return 'Welcome';
    }
}