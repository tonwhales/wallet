import { getAppState } from "../storage/appState";
import { needSync } from "../sync/initialSync";

export function resolveOnboarding(): 'backup' | 'sync' | 'home' | 'welcome' {
    const state = getAppState();
    if (state) {
        if (state.backupCompleted) {
            if (needSync(state)) {
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