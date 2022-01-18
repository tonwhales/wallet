import { getAppState } from "./appState";
import { storage } from "./storage";
import { needUpgrade } from "./needUpgrade";

export function resolveOnboarding(): 'backup' | 'sync' | 'home' | 'welcome' {
    const state = getAppState();
    if (state) {
        if (storage.getBoolean('ton-backup-completed')) {
            if (needUpgrade()) {
                return 'sync';
            } else {
                return 'home';
            }
        } else {
            return 'backup';
        }
    } else {
        return 'welcome';
    }
}