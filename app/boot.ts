// import { delay } from "teslabot";

import { getAppState, storage } from "./utils/storage";

export async function boot() {
    const state = storage.getString('app_state');
    if (state) {
        let parsed = JSON.parse(state);
        if (!parsed.publicKey) {
            // Need upgrade
        }
    }
}