import { AppState } from "react-native";
import { fetchApy } from "../../api/fetchApy";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startApySync(engine: Engine) {
    // Sync
    let sync = createEngineSync('stakingApy', engine, async () => {
        let data = await fetchApy(engine.isTestnet);
        engine.persistence.stakingApy.item().update(() => data);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}