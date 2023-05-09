import { AppState } from "react-native";
import { Address } from "ton";
import { fetchHints } from "../api/fetchHints";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { requestAllHintsIfNeeded } from "./ops";

export function startHintsSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: engine.isTestnet })}/hints/external`;

    let sync = createEngineSync(key, engine, async () => {
        // Fetch hints
        let hints = await fetchHints(address, engine.isTestnet);

        // Request all hints
        requestAllHintsIfNeeded(hints, null, engine);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}