import { AppState } from "react-native";
import { fetchConfig } from "../../api/fetchConfig";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startServerConfigSync(engine: Engine) {
    
    let sync = createEngineSync('server-config', engine, async () => {
        // Fetch hints
        let config = await fetchConfig();
        engine.persistence.serverConfig.setValue(undefined, config);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}