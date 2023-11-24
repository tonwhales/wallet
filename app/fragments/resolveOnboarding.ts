import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { storage } from "../storage/storage";
import { PasscodeState, getPasscodeState, loadKeyStorageType } from "../storage/secureStorage";
import { getLockAppWithAuthState } from "../engine/state/lockAppWithAuthState";

export const wasPasscodeSetupShownKey = 'passcode-setup-shown';

function isPasscodeSetupShown(): boolean {
    return storage.getBoolean(wasPasscodeSetupShownKey) ?? false;
}

type OnboardingState = 'Welcome' | 'WalletUpgrade' | 'PasscodeSetupInit' | 'WalletCreated' | 'Home' | 'AppStartAuth' | 'KeyStoreMigration';

export function resolveOnboarding(isTestnet: boolean, appStart?: boolean): OnboardingState {
    const state = getAppState();
    const wasPasscodeSetupShown = isPasscodeSetupShown();
    const storageType = loadKeyStorageType();
    const isKeyStore = storageType === 'key-store';
    const authOnStart = getLockAppWithAuthState() ?? false;

    if (state.selected >= 0) {
        if (authOnStart && appStart) {
            return 'AppStartAuth';
        }
        const address = getCurrentAddress();
        if (isAddressSecured(address.address, isTestnet)) {

            if (isKeyStore) {
                return 'KeyStoreMigration';
            }

            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            if (!wasPasscodeSetupShown && !passcodeSet) {
                return 'PasscodeSetupInit';
            }
            return 'Home';
        } else if (canUpgradeAppState()) {
            return 'WalletUpgrade'
        } else {
            return 'WalletCreated';
        }
    } else if (canUpgradeAppState()) {
        return 'WalletUpgrade';
    } else {
        return 'Welcome';
    }
}