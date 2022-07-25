import { canUpgradeAppState, getAppState, getCurrentAddress, isAddressSecured } from "../storage/appState";
import { Engine } from "../engine/Engine";

export function resolveOnboarding(engine: Engine | null): 'backup' | 'sync' | 'home' | 'welcome' | 'upgrade-store' {
    const state = getAppState();
    if (state.selected >= 0) {
        const address = getCurrentAddress();
        if (isAddressSecured(address.address)) {
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