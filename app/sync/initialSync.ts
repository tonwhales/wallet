import { delay } from "teslabot";
import { AppState } from "../storage/appState";
import { storage } from "../storage/storage";

export function needSync(state: AppState) {
    if (!storage.getBoolean('need-sync')) {
        return true;
    }
    return false;
}

export async function doInitialSync() {
    await delay(1000);
    storage.set('need-sync', true);
}