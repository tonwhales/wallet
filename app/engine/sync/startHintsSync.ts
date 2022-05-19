import { AppState } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { log } from "../../utils/log";
import { fetchHints } from "../api/fetchHints";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startHintsSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/hints/external`;
    let state = engine.persistence.accountHints.item(address);

    let sync = createEngineSync(key, engine, async () => {

        // Fetch hints
        let hints = await fetchHints(address);

        // Persist
        state.update((s) => {
            if (s) {

                // Result array
                let res = [...s];

                // Existing
                let ex = new Set<string>();
                for (let a of s) {
                    ex.add(a.toFriendly({ testOnly: AppConfig.isTestnet }));
                }

                // New
                for (let m of hints) {
                    if (!ex.has(m.toFriendly({ testOnly: AppConfig.isTestnet }))) {
                        res.push(m);
                        log('[hints]: ' + m.toFriendly({ testOnly: AppConfig.isTestnet }));
                    }
                }

                return res;
            } else {
                return hints;
            }
        });
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}