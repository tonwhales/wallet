import { getAppState } from "../storage/appState";
import { Engine } from "../sync/Engine";

export function resolveOnboarding(engine: Engine | null): 'backup' | 'sync' | 'home' | 'welcome' {
    const state = getAppState();
    if (state) {
        if (state.backupCompleted) {
            if (engine && !engine.ready) {
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