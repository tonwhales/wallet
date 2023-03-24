import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { fetchHints } from "../api/fetchHints";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { requestAllHintsIfNeeded } from "./ops";

export function startAddressHintsSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/hints/external`;

    let sync = createEngineSync(key, engine, async () => {
        // Fetch hints
        let hints = await fetchHints(address);

        // Request all hints
        requestAllHintsIfNeeded(hints, null, engine, address);
    });

    // Invalidate on start
    sync.invalidate();
}