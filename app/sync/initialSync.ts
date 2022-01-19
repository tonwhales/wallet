import { delay } from "teslabot";
import { AppState } from "../storage/appState";
import { mainnetCache, testnetCache } from "../storage/cache";

export function needSync(state: AppState) {
    // const cache = state.testnet ? testnetCache : mainnetCache;
    // const accountState = cache.loadState(state.address);
    // if (!accountState) {
    //     return true;
    // }

    return false;
}

export async function doInitialSync(state: AppState) {
    if (!needSync(state)) {
        return;
    }

    
    await delay(1000);
}