import { AppState } from "react-native";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startCorpSync(engine: Engine) {

    let sync = createEngineSync('corp-sync', engine, async () => {
        await engine.products.corp.doSync();
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}